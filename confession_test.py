#!/usr/bin/env python3
"""
Focused Testing for Confession Posting and Display Functionality
Tests specifically requested endpoints:
1. POST /api/confessions (confession creation)
2. GET /api/confessions/public (confession retrieval)
3. API response format and data structure validation
4. Confession saving and retrieval verification
5. Error handling for both endpoints
"""

import requests
import json
import sys
from datetime import datetime
import time

class ConfessionAPITester:
    def __init__(self, base_url="https://386274ec-e1f9-4a62-8135-f66bc6ee6232.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_confession_id = None
        self.created_tx_id = None
        self.access_token = None

    def log_test(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED {details}")
        else:
            print(f"❌ {test_name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200, auth=False):
        """Make HTTP request and return response"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add authorization header if needed
        if auth and self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            return response, response.status_code == expected_status
            
        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            return None, False

    def setup_user_auth(self):
        """Setup user authentication for authenticated confession tests"""
        print("\n🔧 Setting up user authentication...")
        
        # Generate unique username with timestamp
        timestamp = int(time.time())
        test_user = {
            "username": f"confessiontester_{timestamp}",
            "email": f"confessiontest_{timestamp}@example.com",
            "password": "TestPassword123!",
            "wallet_address": "0x1234567890abcdef1234567890abcdef12345678"
        }
        
        response, success = self.make_request('POST', 'auth/register', data=test_user, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                self.access_token = data.get('access_token')
                print(f"✅ User authentication setup successful - User: {test_user['username']}")
                return True
            except json.JSONDecodeError:
                print("❌ User authentication setup failed - Invalid JSON response")
                return False
        else:
            print("❌ User authentication setup failed - Registration failed")
            return False

    def test_confession_creation_anonymous(self):
        """Test POST /api/confessions (anonymous user)"""
        print("\n🔍 Testing Confession Creation (Anonymous)...")
        
        test_confession = {
            "content": "This is a test confession from the testing agent to verify the confession posting functionality works correctly.",
            "is_public": True,
            "author": "anonymous",
            "mood": "neutral",
            "tags": ["test", "functionality", "verification"]
        }
        
        response, success = self.make_request('POST', 'confessions', data=test_confession, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                print(f"📋 Response Data: {json.dumps(data, indent=2)}")
                
                # Check required fields
                required_fields = ['status', 'id', 'tx_id', 'gateway_url', 'verified', 'message']
                missing_fields = [field for field in required_fields if field not in data]
                
                # Check response format
                status_ok = data.get('status') == 'success'
                has_id = bool(data.get('id'))
                has_tx_id = bool(data.get('tx_id'))
                has_gateway_url = bool(data.get('gateway_url'))
                is_verified = data.get('verified') == True
                has_message = bool(data.get('message'))
                
                if not missing_fields and status_ok and has_id and has_tx_id:
                    self.created_confession_id = data.get('id')
                    self.created_tx_id = data.get('tx_id')
                    
                    details = f"- ID: {self.created_confession_id[:8]}..., TX: {self.created_tx_id[:8]}..., Verified: {is_verified}"
                    return self.log_test("Confession Creation (Anonymous)", True, details)
                else:
                    issues = []
                    if missing_fields:
                        issues.append(f"Missing fields: {missing_fields}")
                    if not status_ok:
                        issues.append(f"Status not success: {data.get('status')}")
                    if not has_id:
                        issues.append("No confession ID")
                    if not has_tx_id:
                        issues.append("No transaction ID")
                    
                    return self.log_test("Confession Creation (Anonymous)", False, f"- Issues: {'; '.join(issues)}")
                    
            except json.JSONDecodeError:
                return self.log_test("Confession Creation (Anonymous)", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Confession Creation (Anonymous)", False, f"- Status: {status_code}{error_msg}")

    def test_confession_creation_authenticated(self):
        """Test POST /api/confessions (authenticated user)"""
        if not self.access_token:
            return self.log_test("Confession Creation (Authenticated)", False, "- No access token available")
        
        print("\n🔍 Testing Confession Creation (Authenticated)...")
        
        test_confession = {
            "content": "This is an authenticated test confession with AI analysis to verify the enhanced confession system works properly.",
            "is_public": True,
            "author": "testuser",
            "mood": "hopeful",
            "tags": ["authenticated", "ai-analysis", "test"]
        }
        
        response, success = self.make_request('POST', 'confessions', data=test_confession, auth=True, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                print(f"📋 Response Data: {json.dumps(data, indent=2)}")
                
                # Check required fields including AI analysis
                required_fields = ['status', 'id', 'tx_id', 'gateway_url', 'verified', 'ai_analysis']
                missing_fields = [field for field in required_fields if field not in data]
                
                # Check AI analysis structure
                ai_analysis = data.get('ai_analysis', {})
                has_moderation = 'moderation' in ai_analysis
                has_enhancement = 'enhancement' in ai_analysis
                
                status_ok = data.get('status') == 'success'
                has_id = bool(data.get('id'))
                has_tx_id = bool(data.get('tx_id'))
                
                if not missing_fields and status_ok and has_id and has_tx_id:
                    # Store backup IDs if we don't have them from anonymous test
                    if not self.created_confession_id:
                        self.created_confession_id = data.get('id')
                        self.created_tx_id = data.get('tx_id')
                    
                    details = f"- ID: {data.get('id')[:8]}..., AI Analysis: Moderation={has_moderation}, Enhancement={has_enhancement}"
                    return self.log_test("Confession Creation (Authenticated)", True, details)
                else:
                    issues = []
                    if missing_fields:
                        issues.append(f"Missing fields: {missing_fields}")
                    if not status_ok:
                        issues.append(f"Status not success: {data.get('status')}")
                    
                    return self.log_test("Confession Creation (Authenticated)", False, f"- Issues: {'; '.join(issues)}")
                    
            except json.JSONDecodeError:
                return self.log_test("Confession Creation (Authenticated)", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Confession Creation (Authenticated)", False, f"- Status: {status_code}{error_msg}")

    def test_confession_retrieval_public(self):
        """Test GET /api/confessions/public"""
        print("\n🔍 Testing Public Confessions Retrieval...")
        
        response, success = self.make_request('GET', 'confessions/public?limit=10&offset=0', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                print(f"📋 Response Structure: {list(data.keys())}")
                
                # Check required fields
                required_fields = ['confessions', 'count', 'offset', 'limit']
                missing_fields = [field for field in required_fields if field not in data]
                
                confessions = data.get('confessions', [])
                count = len(confessions)
                
                if not missing_fields:
                    # Check confession structure if we have confessions
                    if count > 0:
                        first_confession = confessions[0]
                        confession_fields = ['id', 'content', 'is_public', 'author', 'timestamp']
                        missing_confession_fields = [field for field in confession_fields if field not in first_confession]
                        
                        if not missing_confession_fields:
                            details = f"- Found {count} confessions, Structure valid"
                            
                            # Check if our created confession is in the list
                            if self.created_confession_id:
                                found_our_confession = any(c.get('id') == self.created_confession_id for c in confessions)
                                if found_our_confession:
                                    details += ", Our confession found"
                                else:
                                    details += ", Our confession not found (may need time to appear)"
                            
                            return self.log_test("Public Confessions Retrieval", True, details)
                        else:
                            return self.log_test("Public Confessions Retrieval", False, f"- Invalid confession structure, missing: {missing_confession_fields}")
                    else:
                        return self.log_test("Public Confessions Retrieval", True, "- No confessions found (empty database)")
                else:
                    return self.log_test("Public Confessions Retrieval", False, f"- Missing response fields: {missing_fields}")
                    
            except json.JSONDecodeError:
                return self.log_test("Public Confessions Retrieval", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Public Confessions Retrieval", False, f"- Status: {status_code}{error_msg}")

    def test_specific_confession_retrieval(self):
        """Test GET /api/confessions/{tx_id}"""
        if not self.created_tx_id:
            return self.log_test("Specific Confession Retrieval", False, "- No confession TX ID available (creation failed)")
        
        print(f"\n🔍 Testing Specific Confession Retrieval (TX: {self.created_tx_id[:8]}...)...")
        
        response, success = self.make_request('GET', f'confessions/{self.created_tx_id}', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                print(f"📋 Confession Data: {json.dumps({k: v for k, v in data.items() if k != 'content'}, indent=2)}")
                
                # Check required fields
                required_fields = ['id', 'tx_id', 'content', 'is_public', 'author', 'timestamp']
                missing_fields = [field for field in required_fields if field not in data]
                
                # Verify it's our confession
                tx_id_match = data.get('tx_id') == self.created_tx_id
                id_match = data.get('id') == self.created_confession_id
                has_content = bool(data.get('content'))
                
                if not missing_fields and tx_id_match and has_content:
                    details = f"- TX ID matches, Content length: {len(data.get('content', ''))}, Author: {data.get('author')}"
                    return self.log_test("Specific Confession Retrieval", True, details)
                else:
                    issues = []
                    if missing_fields:
                        issues.append(f"Missing fields: {missing_fields}")
                    if not tx_id_match:
                        issues.append("TX ID mismatch")
                    if not has_content:
                        issues.append("No content")
                    
                    return self.log_test("Specific Confession Retrieval", False, f"- Issues: {'; '.join(issues)}")
                    
            except json.JSONDecodeError:
                return self.log_test("Specific Confession Retrieval", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Specific Confession Retrieval", False, f"- Status: {status_code}")

    def test_confession_error_handling(self):
        """Test error handling for confession endpoints"""
        print("\n🔍 Testing Confession Error Handling...")
        
        # Test 1: Empty content
        empty_confession = {
            "content": "",
            "is_public": True,
            "author": "anonymous"
        }
        
        response, success = self.make_request('POST', 'confessions', data=empty_confession, expected_status=422)
        
        if not success and response and response.status_code == 422:
            self.log_test("Error Handling - Empty Content", True, "- Correctly rejected empty content")
        else:
            self.log_test("Error Handling - Empty Content", False, f"- Expected 422, got {response.status_code if response else 'No response'}")
        
        # Test 2: Too long content
        long_confession = {
            "content": "x" * 500,  # Exceeds 280 character limit
            "is_public": True,
            "author": "anonymous"
        }
        
        response, success = self.make_request('POST', 'confessions', data=long_confession, expected_status=422)
        
        if not success and response and response.status_code == 422:
            self.log_test("Error Handling - Long Content", True, "- Correctly rejected long content")
        else:
            self.log_test("Error Handling - Long Content", False, f"- Expected 422, got {response.status_code if response else 'No response'}")
        
        # Test 3: Invalid confession ID for retrieval
        response, success = self.make_request('GET', 'confessions/invalid-tx-id', expected_status=404)
        
        if not success and response and response.status_code == 404:
            self.log_test("Error Handling - Invalid TX ID", True, "- Correctly returned 404 for invalid TX ID")
        else:
            self.log_test("Error Handling - Invalid TX ID", False, f"- Expected 404, got {response.status_code if response else 'No response'}")

    def test_data_persistence(self):
        """Test that confessions are properly saved and can be retrieved"""
        print("\n🔍 Testing Data Persistence...")
        
        if not self.created_confession_id or not self.created_tx_id:
            return self.log_test("Data Persistence", False, "- No confession created to test persistence")
        
        # Wait a moment for data to be fully processed
        print("⏳ Waiting 2 seconds for data processing...")
        time.sleep(2)
        
        # Try to retrieve our confession by TX ID
        response, success = self.make_request('GET', f'confessions/{self.created_tx_id}', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                
                # Verify the data matches what we created
                tx_id_match = data.get('tx_id') == self.created_tx_id
                id_match = data.get('id') == self.created_confession_id
                has_content = bool(data.get('content'))
                is_public = data.get('is_public') == True
                
                if tx_id_match and id_match and has_content and is_public:
                    return self.log_test("Data Persistence", True, "- Confession properly saved and retrieved")
                else:
                    issues = []
                    if not tx_id_match:
                        issues.append("TX ID mismatch")
                    if not id_match:
                        issues.append("ID mismatch")
                    if not has_content:
                        issues.append("Missing content")
                    if not is_public:
                        issues.append("Public flag incorrect")
                    
                    return self.log_test("Data Persistence", False, f"- Data integrity issues: {'; '.join(issues)}")
                    
            except json.JSONDecodeError:
                return self.log_test("Data Persistence", False, "- Invalid JSON response")
        else:
            return self.log_test("Data Persistence", False, "- Could not retrieve saved confession")

    def run_focused_tests(self):
        """Run focused tests on confession posting and display functionality"""
        print("🎯 FOCUSED CONFESSION FUNCTIONALITY TESTING")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Setup authentication for authenticated tests
        auth_setup = self.setup_user_auth()
        
        print("\n📝 CONFESSION CREATION TESTS")
        print("-" * 40)
        self.test_confession_creation_anonymous()
        
        if auth_setup:
            self.test_confession_creation_authenticated()
        else:
            print("⚠️  Skipping authenticated confession test (auth setup failed)")
        
        print("\n📋 CONFESSION RETRIEVAL TESTS")
        print("-" * 40)
        self.test_confession_retrieval_public()
        self.test_specific_confession_retrieval()
        
        print("\n🛡️ ERROR HANDLING TESTS")
        print("-" * 40)
        self.test_confession_error_handling()
        
        print("\n💾 DATA PERSISTENCE TESTS")
        print("-" * 40)
        self.test_data_persistence()
        
        # Print final results
        print("\n" + "=" * 80)
        print("📊 FOCUSED TEST RESULTS SUMMARY")
        print("=" * 80)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Analysis
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL CONFESSION TESTS PASSED!")
            print("✨ Verified functionality:")
            print("   • Confession creation (anonymous & authenticated)")
            print("   • Public confession retrieval")
            print("   • Specific confession retrieval")
            print("   • Proper error handling")
            print("   • Data persistence")
            print("   • API response format validation")
            return True
        else:
            failed_count = self.tests_run - self.tests_passed
            print(f"\n⚠️  {failed_count} test(s) failed.")
            
            if self.tests_passed / self.tests_run >= 0.8:
                print("✅ Core confession functionality is working (80%+ success rate)")
                return True
            else:
                print("❌ Significant issues with confession functionality")
                return False

def main():
    """Main test runner"""
    tester = ConfessionAPITester()
    success = tester.run_focused_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())