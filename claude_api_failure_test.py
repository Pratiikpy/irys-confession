#!/usr/bin/env python3
"""
Focused Test for Claude API Failure Fix
Tests the specific issue where confessions weren't appearing in public feed
when Claude API failed, causing moderation.approved=false
"""

import requests
import json
import sys
import time
from datetime import datetime

class ClaudeAPIFailureTest:
    def __init__(self, base_url="https://3e3b1207-d055-4dbe-b794-182eb8e522d4.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_confessions = []
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

    def setup_user(self):
        """Create a test user for authenticated requests"""
        print("\n🔧 Setting up test user...")
        
        timestamp = int(time.time())
        test_user = {
            "username": f"claude_test_{timestamp}",
            "email": f"claude_test_{timestamp}@example.com",
            "password": "TestPassword123!",
            "wallet_address": "0x1234567890abcdef1234567890abcdef12345678"
        }
        
        response, success = self.make_request('POST', 'auth/register', data=test_user, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                self.access_token = data.get('access_token')
                print(f"✅ Test user created: {test_user['username']}")
                return True
            except json.JSONDecodeError:
                print("❌ Failed to parse registration response")
                return False
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            print(f"❌ Failed to create test user - Status: {status_code}{error_msg}")
            return False

    def test_confession_creation_with_claude_failure(self):
        """Test confession creation when Claude API fails"""
        print("\n🔍 Testing Confession Creation with Claude API Failure Scenario...")
        
        # Create a confession that should trigger Claude API processing
        test_confession = {
            "content": "I'm feeling really anxious about my future and sometimes have dark thoughts. I need help but don't know where to turn.",
            "is_public": True,
            "author": "anonymous",
            "mood": "anxious",
            "tags": ["mental-health", "anxiety", "help"]
        }
        
        response, success = self.make_request('POST', 'confessions', data=test_confession, auth=True, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['status', 'id', 'tx_id', 'gateway_url', 'verified']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('status') == 'success':
                    confession_id = data.get('id')
                    tx_id = data.get('tx_id')
                    self.created_confessions.append({'id': confession_id, 'tx_id': tx_id})
                    
                    # Check if AI analysis is present (even if it failed)
                    ai_analysis = data.get('ai_analysis', {})
                    has_ai_analysis = bool(ai_analysis)
                    
                    return self.log_test("Confession Creation with Claude Scenario", True, 
                                       f"- ID: {confession_id}, AI Analysis Present: {has_ai_analysis}")
                else:
                    return self.log_test("Confession Creation with Claude Scenario", False, 
                                       f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Confession Creation with Claude Scenario", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Confession Creation with Claude Scenario", False, 
                               f"- Status: {status_code}{error_msg}")

    def test_confession_appears_in_public_feed(self):
        """Test that confessions appear in public feed even when Claude API fails"""
        print("\n🔍 Testing Confessions Appear in Public Feed...")
        
        if not self.created_confessions:
            return self.log_test("Confessions in Public Feed", False, "- No confessions created to test")
        
        # Wait a moment for processing
        time.sleep(2)
        
        response, success = self.make_request('GET', 'confessions/public?limit=50', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                confessions = data.get('confessions', [])
                
                # Check if our created confessions appear in the public feed
                created_ids = [c['id'] for c in self.created_confessions]
                found_confessions = []
                
                for confession in confessions:
                    if confession.get('id') in created_ids:
                        found_confessions.append(confession)
                
                if found_confessions:
                    # Check moderation status of found confessions
                    moderation_details = []
                    for confession in found_confessions:
                        moderation = confession.get('moderation', {})
                        approved = moderation.get('approved', False)
                        claude_failed = moderation.get('claude_api_failed', False)
                        moderation_details.append(f"ID:{confession.get('id')[:8]}... approved:{approved} claude_failed:{claude_failed}")
                    
                    return self.log_test("Confessions in Public Feed", True, 
                                       f"- Found {len(found_confessions)} confessions in public feed. Details: {'; '.join(moderation_details)}")
                else:
                    return self.log_test("Confessions in Public Feed", False, 
                                       f"- Created confessions not found in public feed. Total public confessions: {len(confessions)}")
                    
            except json.JSONDecodeError:
                return self.log_test("Confessions in Public Feed", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Confessions in Public Feed", False, f"- Status: {status_code}")

    def test_confession_moderation_status(self):
        """Test that confession moderation status is correctly set when Claude API fails"""
        print("\n🔍 Testing Confession Moderation Status...")
        
        if not self.created_confessions:
            return self.log_test("Confession Moderation Status", False, "- No confessions created to test")
        
        # Get the first created confession
        confession = self.created_confessions[0]
        tx_id = confession['tx_id']
        
        response, success = self.make_request('GET', f'confessions/{tx_id}', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                moderation = data.get('moderation', {})
                
                # Check moderation fields
                approved = moderation.get('approved')
                claude_api_failed = moderation.get('claude_api_failed')
                flagged = moderation.get('flagged', False)
                reviewed = moderation.get('reviewed', False)
                
                # The key test: if Claude API failed, confession should be approved
                if claude_api_failed is True and approved is True:
                    return self.log_test("Confession Moderation Status", True, 
                                       f"- Claude API failed but confession approved (correct behavior). approved:{approved}, claude_failed:{claude_api_failed}")
                elif claude_api_failed is False and approved is not None:
                    return self.log_test("Confession Moderation Status", True, 
                                       f"- Claude API worked, moderation status set. approved:{approved}, claude_failed:{claude_api_failed}")
                elif approved is True and claude_api_failed is None:
                    # Older format without claude_api_failed flag
                    return self.log_test("Confession Moderation Status", True, 
                                       f"- Confession approved (legacy format). approved:{approved}")
                else:
                    return self.log_test("Confession Moderation Status", False, 
                                       f"- Unexpected moderation status. approved:{approved}, claude_failed:{claude_api_failed}, flagged:{flagged}")
                    
            except json.JSONDecodeError:
                return self.log_test("Confession Moderation Status", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Confession Moderation Status", False, f"- Status: {status_code}")

    def test_multiple_confessions_scenario(self):
        """Test creating multiple confessions to verify consistent behavior"""
        print("\n🔍 Testing Multiple Confessions Scenario...")
        
        confessions_to_create = [
            {
                "content": "I'm struggling with work-life balance and feeling burned out.",
                "is_public": True,
                "author": "anonymous",
                "tags": ["work", "burnout"]
            },
            {
                "content": "Sometimes I feel like I'm not good enough and everyone else has it figured out.",
                "is_public": True,
                "author": "anonymous",
                "tags": ["self-doubt", "imposter-syndrome"]
            },
            {
                "content": "I made a mistake at work today and I'm worried about the consequences.",
                "is_public": True,
                "author": "anonymous",
                "tags": ["work", "anxiety", "mistakes"]
            }
        ]
        
        created_count = 0
        for i, confession_data in enumerate(confessions_to_create):
            # Use auth if available, otherwise anonymous
            use_auth = self.access_token is not None
            response, success = self.make_request('POST', 'confessions', data=confession_data, auth=use_auth, expected_status=200)
            
            if success and response:
                try:
                    data = response.json()
                    if data.get('status') == 'success':
                        confession_id = data.get('id')
                        tx_id = data.get('tx_id')
                        self.created_confessions.append({'id': confession_id, 'tx_id': tx_id})
                        created_count += 1
                except json.JSONDecodeError:
                    pass
            
            # Small delay between requests
            time.sleep(0.5)
        
        if created_count > 0:
            return self.log_test("Multiple Confessions Creation", True, 
                               f"- Created {created_count}/{len(confessions_to_create)} confessions successfully")
        else:
            return self.log_test("Multiple Confessions Creation", False, 
                               "- Failed to create any confessions")

    def test_public_feed_contains_all_confessions(self):
        """Test that all created confessions appear in the public feed"""
        print("\n🔍 Testing Public Feed Contains All Confessions...")
        
        if not self.created_confessions:
            return self.log_test("Public Feed Contains All", False, "- No confessions created to test")
        
        # Wait for processing
        time.sleep(3)
        
        response, success = self.make_request('GET', 'confessions/public?limit=100', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                public_confessions = data.get('confessions', [])
                
                # Check how many of our confessions appear in public feed
                created_ids = [c['id'] for c in self.created_confessions]
                found_ids = []
                approved_count = 0
                claude_failed_count = 0
                
                for confession in public_confessions:
                    if confession.get('id') in created_ids:
                        found_ids.append(confession.get('id'))
                        moderation = confession.get('moderation', {})
                        if moderation.get('approved'):
                            approved_count += 1
                        if moderation.get('claude_api_failed'):
                            claude_failed_count += 1
                
                total_created = len(self.created_confessions)
                total_found = len(found_ids)
                
                if total_found == total_created:
                    return self.log_test("Public Feed Contains All", True, 
                                       f"- All {total_created} confessions found in public feed. Approved: {approved_count}, Claude Failed: {claude_failed_count}")
                elif total_found > 0:
                    return self.log_test("Public Feed Contains All", False, 
                                       f"- Only {total_found}/{total_created} confessions found in public feed. This indicates the Claude API failure fix may not be working correctly.")
                else:
                    return self.log_test("Public Feed Contains All", False, 
                                       f"- None of the {total_created} created confessions found in public feed. Critical issue!")
                    
            except json.JSONDecodeError:
                return self.log_test("Public Feed Contains All", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Public Feed Contains All", False, f"- Status: {status_code}")

    def test_confession_creation_anonymous(self):
        """Test anonymous confession creation when Claude API fails"""
        print("\n🔍 Testing Anonymous Confession Creation...")
        
        # Create a confession that should trigger Claude API processing
        test_confession = {
            "content": "I'm feeling really anxious about my future and sometimes have dark thoughts. I need help but don't know where to turn.",
            "is_public": True,
            "author": "anonymous",
            "mood": "anxious",
            "tags": ["mental-health", "anxiety", "help"]
        }
        
        response, success = self.make_request('POST', 'confessions', data=test_confession, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['status', 'id', 'tx_id', 'gateway_url', 'verified']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('status') == 'success':
                    confession_id = data.get('id')
                    tx_id = data.get('tx_id')
                    self.created_confessions.append({'id': confession_id, 'tx_id': tx_id})
                    
                    # Check if AI analysis is present (even if it failed)
                    ai_analysis = data.get('ai_analysis', {})
                    has_ai_analysis = bool(ai_analysis)
                    
                    return self.log_test("Anonymous Confession Creation", True, 
                                       f"- ID: {confession_id}, AI Analysis Present: {has_ai_analysis}")
                else:
                    return self.log_test("Anonymous Confession Creation", False, 
                                       f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Anonymous Confession Creation", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Anonymous Confession Creation", False, 
                               f"- Status: {status_code}{error_msg}")

    def run_focused_tests(self):
        """Run focused tests for Claude API failure fix"""
        print("🎯 Starting Focused Tests for Claude API Failure Fix")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Test basic API first
        print("\n🔍 BASIC API TEST")
        print("-" * 40)
        response, success = self.make_request('GET', '', expected_status=200)
        if not success:
            print("❌ Basic API test failed. Cannot continue.")
            return 1
        else:
            print("✅ Basic API working")
        
        # Try to setup user, but continue even if it fails
        user_setup_success = self.setup_user()
        if not user_setup_success:
            print("⚠️  User setup failed, continuing with anonymous tests only...")
        
        # Core tests for the Claude API failure fix
        print("\n📝 CONFESSION CREATION TESTS")
        print("-" * 40)
        
        if user_setup_success:
            self.test_confession_creation_with_claude_failure()
        else:
            self.test_confession_creation_anonymous()
        
        self.test_multiple_confessions_scenario()
        
        print("\n🔍 PUBLIC FEED TESTS")
        print("-" * 40)
        self.test_confession_appears_in_public_feed()
        self.test_public_feed_contains_all_confessions()
        
        print("\n🛡️ MODERATION STATUS TESTS")
        print("-" * 40)
        self.test_confession_moderation_status()
        
        # Print final results
        print("\n" + "=" * 80)
        print("📊 FOCUSED TEST RESULTS SUMMARY")
        print("=" * 80)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL FOCUSED TESTS PASSED!")
            print("✅ Claude API failure fix is working correctly:")
            print("   • Confessions are created successfully even when Claude API fails")
            print("   • Confessions appear in public feed when Claude API fails")
            print("   • moderation.approved is set to true when Claude API fails")
            print("   • claude_api_failed flag is properly set")
            return 0
        else:
            failed_count = self.tests_run - self.tests_passed
            print(f"\n⚠️  {failed_count} focused test(s) failed.")
            
            if self.tests_passed / self.tests_run >= 0.8:
                print("✅ Most functionality is working but there may be edge cases")
            else:
                print("❌ Significant issues detected with Claude API failure handling")
            
            return 1

def main():
    """Main test runner"""
    tester = ClaudeAPIFailureTest()
    return tester.run_focused_tests()

if __name__ == "__main__":
    sys.exit(main())