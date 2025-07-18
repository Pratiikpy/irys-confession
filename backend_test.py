#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Irys Confession Board
Tests all endpoints using the public URL
"""

import requests
import json
import sys
from datetime import datetime
import time

class IrysConfessionAPITester:
    def __init__(self, base_url="https://07dc0b05-7562-4f0a-a3bf-31a5cb981e46.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_confession_id = None
        self.created_tx_id = None

    def log_test(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED {details}")
        else:
            print(f"❌ {test_name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request and return response"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")

            return response, response.status_code == expected_status
            
        except requests.exceptions.RequestException as e:
            print(f"Request error: {str(e)}")
            return None, False

    def test_health_check(self):
        """Test GET /api/health"""
        print("\n🔍 Testing Health Check Endpoint...")
        response, success = self.make_request('GET', 'health', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                has_status = 'status' in data and data['status'] == 'healthy'
                has_timestamp = 'timestamp' in data
                
                if has_status and has_timestamp:
                    return self.log_test("Health Check", True, f"- Status: {data['status']}")
                else:
                    return self.log_test("Health Check", False, "- Missing required fields")
            except json.JSONDecodeError:
                return self.log_test("Health Check", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Health Check", False, f"- Status: {status_code}")

    def test_irys_network_info(self):
        """Test GET /api/irys/network-info"""
        print("\n🔍 Testing Irys Network Info...")
        response, success = self.make_request('GET', 'irys/network-info', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['network', 'gateway_url', 'rpc_url', 'explorer_url', 'faucet_url']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    return self.log_test("Irys Network Info", True, f"- Network: {data['network']}")
                else:
                    return self.log_test("Irys Network Info", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Irys Network Info", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Irys Network Info", False, f"- Status: {status_code}")

    def test_irys_address(self):
        """Test GET /api/irys/address"""
        print("\n🔍 Testing Irys Address...")
        response, success = self.make_request('GET', 'irys/address', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                # Check if response has address or success field
                has_data = bool(data)  # Any non-empty response is considered valid
                
                if has_data:
                    return self.log_test("Irys Address", True, f"- Response: {str(data)[:100]}...")
                else:
                    return self.log_test("Irys Address", False, "- Empty response")
            except json.JSONDecodeError:
                return self.log_test("Irys Address", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Irys Address", False, f"- Status: {status_code}")

    def test_create_confession(self):
        """Test POST /api/confessions"""
        print("\n🔍 Testing Create Confession...")
        
        test_confession = {
            "content": "This is a test confession from the testing agent",
            "is_public": True,
            "author": "test_user"
        }
        
        response, success = self.make_request('POST', 'confessions', data=test_confession, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['status', 'id', 'tx_id', 'gateway_url', 'verified']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('status') == 'success':
                    self.created_confession_id = data.get('id')
                    self.created_tx_id = data.get('tx_id')
                    return self.log_test("Create Confession", True, f"- ID: {self.created_confession_id}, TX: {self.created_tx_id}")
                else:
                    return self.log_test("Create Confession", False, f"- Missing fields: {missing_fields} or status not success")
            except json.JSONDecodeError:
                return self.log_test("Create Confession", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Create Confession", False, f"- Status: {status_code}{error_msg}")

    def test_get_public_confessions(self):
        """Test GET /api/confessions/public"""
        print("\n🔍 Testing Get Public Confessions...")
        response, success = self.make_request('GET', 'confessions/public?limit=10', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['confessions', 'count', 'offset', 'limit']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    confessions = data.get('confessions', [])
                    count = len(confessions)
                    return self.log_test("Get Public Confessions", True, f"- Found {count} confessions")
                else:
                    return self.log_test("Get Public Confessions", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Get Public Confessions", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Get Public Confessions", False, f"- Status: {status_code}")

    def test_get_trending(self):
        """Test GET /api/trending"""
        print("\n🔍 Testing Get Trending Confessions...")
        response, success = self.make_request('GET', 'trending?limit=5', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['confessions', 'count']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    confessions = data.get('confessions', [])
                    count = len(confessions)
                    return self.log_test("Get Trending", True, f"- Found {count} trending confessions")
                else:
                    return self.log_test("Get Trending", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Get Trending", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Get Trending", False, f"- Status: {status_code}")

    def test_get_specific_confession(self):
        """Test GET /api/confessions/{tx_id}"""
        if not self.created_tx_id:
            return self.log_test("Get Specific Confession", False, "- No confession TX ID available (create confession failed)")
        
        print(f"\n🔍 Testing Get Specific Confession (TX: {self.created_tx_id})...")
        response, success = self.make_request('GET', f'confessions/{self.created_tx_id}', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['id', 'tx_id', 'content', 'is_public', 'author']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('tx_id') == self.created_tx_id:
                    return self.log_test("Get Specific Confession", True, f"- Found confession: {data.get('content')[:50]}...")
                else:
                    return self.log_test("Get Specific Confession", False, f"- Missing fields: {missing_fields} or TX ID mismatch")
            except json.JSONDecodeError:
                return self.log_test("Get Specific Confession", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Get Specific Confession", False, f"- Status: {status_code}")

    def test_vote_confession(self):
        """Test POST /api/confessions/{tx_id}/vote"""
        if not self.created_tx_id:
            return self.log_test("Vote Confession", False, "- No confession TX ID available (create confession failed)")
        
        print(f"\n🔍 Testing Vote on Confession (TX: {self.created_tx_id})...")
        
        vote_data = {
            "vote_type": "upvote",
            "user_address": "test_voter_123"
        }
        
        response, success = self.make_request('POST', f'confessions/{self.created_tx_id}/vote', data=vote_data, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                if data.get('status') == 'success' and 'upvote recorded' in data.get('message', ''):
                    return self.log_test("Vote Confession", True, f"- Vote recorded: {data.get('message')}")
                else:
                    return self.log_test("Vote Confession", False, f"- Unexpected response: {data}")
            except json.JSONDecodeError:
                return self.log_test("Vote Confession", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Vote Confession", False, f"- Status: {status_code}{error_msg}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Irys Confession Board API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 60)
        
        # Run tests in logical order
        self.test_health_check()
        self.test_irys_network_info()
        self.test_irys_address()
        self.test_create_confession()
        
        # Wait a moment for confession to be processed
        if self.created_tx_id:
            print("\n⏳ Waiting 2 seconds for confession to be processed...")
            time.sleep(2)
        
        self.test_get_public_confessions()
        self.test_get_trending()
        self.test_get_specific_confession()
        self.test_vote_confession()
        
        # Print final results
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
            return 0
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed. Check the logs above.")
            return 1

def main():
    """Main test runner"""
    tester = IrysConfessionAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())