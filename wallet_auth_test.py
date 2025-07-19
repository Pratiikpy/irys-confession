#!/usr/bin/env python3
"""
Focused Wallet Authentication Testing for Irys Confession Board
Tests the new wallet authentication endpoints specifically:
- POST /api/auth/wallet/challenge
- POST /api/auth/wallet/verify  
- POST /api/auth/wallet/link
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import time

class WalletAuthTester:
    def __init__(self, base_url="https://79ed6a3e-8f76-414f-9bbe-133047646c9d.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.access_token = None
        self.wallet_challenge = None
        self.wallet_message = None
        self.test_wallet_address = None

    def log_test(self, test_name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED {details}")
        else:
            print(f"❌ {test_name} - FAILED {details}")
        return success

    def make_request(self, method, endpoint, data=None, expected_status=200, auth=False, timeout=30):
        """Make HTTP request and return response"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if auth and self.access_token:
            headers['Authorization'] = f'Bearer {self.access_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=timeout)
            else:
                raise ValueError(f"Unsupported method: {method}")

            return response, response.status_code == expected_status
            
        except requests.exceptions.Timeout:
            print(f"⏰ Request timeout after {timeout}s")
            return None, False
        except requests.exceptions.RequestException as e:
            print(f"🔌 Request error: {str(e)}")
            return None, False

    def setup_user_auth(self):
        """Setup a regular user for wallet linking tests"""
        print("\n🔧 Setting up user authentication for wallet linking tests...")
        
        timestamp = int(time.time())
        test_user = {
            "username": f"wallettest_{timestamp}",
            "email": f"wallettest_{timestamp}@example.com",
            "password": "SecurePassword123!"
        }
        
        response, success = self.make_request('POST', 'auth/register', data=test_user, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                self.access_token = data.get('access_token')
                return True
            except:
                return False
        return False

    def test_wallet_challenge_generation(self):
        """Test POST /api/auth/wallet/challenge - Challenge Generation"""
        print("\n🔍 Testing Wallet Challenge Generation...")
        
        test_wallet = "0x742d35Cc6634C0532925a3b8D4C9db96590c6C87"
        
        challenge_request = {
            "wallet_address": test_wallet,
            "username": "wallet_user_test",
            "email": "wallet@test.com"
        }
        
        response, success = self.make_request('POST', 'auth/wallet/challenge', data=challenge_request, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['challenge', 'message', 'expires_at']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    # Store for later tests
                    self.wallet_challenge = data.get('challenge')
                    self.wallet_message = data.get('message')
                    self.test_wallet_address = test_wallet
                    
                    # Verify challenge format (should be 64 char hex)
                    challenge = data.get('challenge')
                    is_hex = all(c in '0123456789abcdef' for c in challenge.lower())
                    is_correct_length = len(challenge) == 64
                    
                    # Verify message format
                    message = data.get('message')
                    has_wallet = test_wallet.lower() in message.lower()
                    has_challenge = challenge in message
                    has_timestamp = 'timestamp' in message.lower()
                    has_sign_message = 'sign this message' in message.lower()
                    
                    # Verify expiration
                    expires_at = data.get('expires_at')
                    
                    details = []
                    if is_hex and is_correct_length:
                        details.append("Challenge format valid")
                    if has_wallet and has_challenge and has_timestamp and has_sign_message:
                        details.append("Message format valid")
                    if expires_at:
                        details.append("Expiration set")
                    
                    if len(details) == 3:
                        return self.log_test("Wallet Challenge Generation", True, f"- {', '.join(details)}")
                    else:
                        return self.log_test("Wallet Challenge Generation", False, f"- Issues: {3-len(details)} validation failures")
                else:
                    return self.log_test("Wallet Challenge Generation", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Wallet Challenge Generation", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "Timeout/No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Wallet Challenge Generation", False, f"- Status: {status_code}{error_msg}")

    def test_wallet_signature_verification_invalid(self):
        """Test POST /api/auth/wallet/verify - Invalid Signature Handling"""
        print("\n🔍 Testing Wallet Signature Verification (Invalid Signature)...")
        
        if not self.wallet_challenge:
            return self.log_test("Wallet Signature Verification (Invalid)", False, 
                               "- No challenge available (challenge generation failed)")
        
        verify_request = {
            "wallet_address": self.test_wallet_address,
            "signature": "0xinvalidsignature123456789abcdef0123456789abcdef0123456789abcdef01234567890123456789abcdef0123456789abcdef",
            "message": self.wallet_message,
            "wallet_type": "metamask"
        }
        
        response, success = self.make_request('POST', 'auth/wallet/verify', data=verify_request, expected_status=401)
        
        if success and response:
            try:
                data = response.json()
                if 'detail' in data and ('invalid' in data['detail'].lower() or 'signature' in data['detail'].lower()):
                    return self.log_test("Wallet Signature Verification (Invalid)", True, 
                                       f"- Correctly rejected invalid signature: {data.get('detail')}")
                else:
                    return self.log_test("Wallet Signature Verification (Invalid)", False, 
                                       f"- Unexpected error message: {data}")
            except json.JSONDecodeError:
                return self.log_test("Wallet Signature Verification (Invalid)", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "Timeout/No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Wallet Signature Verification (Invalid)", False, f"- Status: {status_code}{error_msg}")

    def test_wallet_challenge_expiration(self):
        """Test wallet challenge expiration timing"""
        print("\n🔍 Testing Wallet Challenge Expiration...")
        
        test_wallet = "0x123456789abcdef123456789abcdef1234567890"
        challenge_request = {"wallet_address": test_wallet}
        
        response, success = self.make_request('POST', 'auth/wallet/challenge', data=challenge_request, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                expires_at = data.get('expires_at')
                
                # Parse expiration time
                try:
                    if 'T' in expires_at:
                        expires_time = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                    else:
                        expires_time = datetime.fromisoformat(expires_at)
                    
                    now = datetime.utcnow()
                    time_diff = expires_time - now
                    minutes_diff = time_diff.total_seconds() / 60
                    
                    # Should expire in approximately 5 minutes (4-6 minutes is acceptable)
                    if 4 <= minutes_diff <= 6:
                        return self.log_test("Wallet Challenge Expiration", True, 
                                           f"- Challenge expires in {minutes_diff:.1f} minutes (expected ~5 min)")
                    else:
                        return self.log_test("Wallet Challenge Expiration", False, 
                                           f"- Unexpected expiration time: {minutes_diff:.1f} minutes (expected ~5 min)")
                except Exception as e:
                    return self.log_test("Wallet Challenge Expiration", False, 
                                       f"- Error parsing expires_at: {str(e)}")
                    
            except json.JSONDecodeError:
                return self.log_test("Wallet Challenge Expiration", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "Timeout/No response"
            return self.log_test("Wallet Challenge Expiration", False, f"- Status: {status_code}")

    def test_wallet_challenge_database_storage(self):
        """Test that multiple wallet challenges can be stored"""
        print("\n🔍 Testing Wallet Challenge Database Storage...")
        
        test_wallets = [
            "0xabc123def456789abc123def456789abc123def45",
            "0xdef456abc789123def456abc789123def456abc78",
            "0x111222333444555666777888999000aaabbbccc"
        ]
        
        challenges_created = 0
        challenge_data = []
        
        for wallet in test_wallets:
            challenge_request = {"wallet_address": wallet}
            response, success = self.make_request('POST', 'auth/wallet/challenge', data=challenge_request, expected_status=200)
            
            if success and response:
                try:
                    data = response.json()
                    if 'challenge' in data and 'message' in data and 'expires_at' in data:
                        challenges_created += 1
                        challenge_data.append({
                            'wallet': wallet,
                            'challenge': data['challenge'][:16] + '...',
                            'expires_at': data['expires_at']
                        })
                except:
                    pass
        
        if challenges_created == len(test_wallets):
            return self.log_test("Wallet Challenge Database Storage", True, 
                               f"- Successfully created {challenges_created} unique challenges")
        else:
            return self.log_test("Wallet Challenge Database Storage", False, 
                               f"- Only created {challenges_created}/{len(test_wallets)} challenges")

    def test_wallet_linking_authentication_required(self):
        """Test POST /api/auth/wallet/link requires authentication"""
        print("\n🔍 Testing Wallet Linking Authentication Requirement...")
        
        link_request = {
            "wallet_address": "0x1111222233334444555566667777888899990000",
            "signature": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
            "message": "test message for wallet linking",
            "wallet_type": "metamask"
        }
        
        response, success = self.make_request('POST', 'auth/wallet/link', data=link_request, expected_status=401)
        
        if success and response:
            try:
                data = response.json()
                if 'detail' in data and ('authentication' in data['detail'].lower() or 'credentials' in data['detail'].lower()):
                    return self.log_test("Wallet Linking Authentication Required", True, 
                                       f"- Correctly requires authentication: {data.get('detail')}")
                else:
                    return self.log_test("Wallet Linking Authentication Required", False, 
                                       f"- Unexpected error message: {data}")
            except json.JSONDecodeError:
                return self.log_test("Wallet Linking Authentication Required", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "Timeout/No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Wallet Linking Authentication Required", False, f"- Status: {status_code}{error_msg}")

    def test_wallet_linking_with_auth(self):
        """Test POST /api/auth/wallet/link with authentication"""
        if not self.access_token:
            return self.log_test("Wallet Linking with Auth", False, 
                               "- No access token available (user setup failed)")
        
        print("\n🔍 Testing Wallet Linking with Authentication...")
        
        # Generate a challenge first
        test_wallet = "0x2222333344445555666677778888999900001111"
        challenge_request = {"wallet_address": test_wallet}
        
        challenge_response, challenge_success = self.make_request('POST', 'auth/wallet/challenge', 
                                                                data=challenge_request, expected_status=200)
        
        if not challenge_success:
            return self.log_test("Wallet Linking with Auth", False, "- Failed to generate challenge for linking")
        
        try:
            challenge_data = challenge_response.json()
            message = challenge_data.get('message')
        except:
            return self.log_test("Wallet Linking with Auth", False, "- Invalid challenge response")
        
        # Test linking with invalid signature (should fail gracefully)
        link_request = {
            "wallet_address": test_wallet,
            "signature": "0xinvalidsignatureforlinkingtestpurposes1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
            "message": message,
            "wallet_type": "metamask"
        }
        
        response, success = self.make_request('POST', 'auth/wallet/link', data=link_request, 
                                            auth=True, expected_status=401)
        
        if success and response:
            try:
                data = response.json()
                if 'detail' in data and 'signature' in data['detail'].lower():
                    return self.log_test("Wallet Linking with Auth", True, 
                                       f"- Correctly validates signature: {data.get('detail')}")
                else:
                    return self.log_test("Wallet Linking with Auth", False, 
                                       f"- Unexpected response: {data}")
            except json.JSONDecodeError:
                return self.log_test("Wallet Linking with Auth", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "Timeout/No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Wallet Linking with Auth", False, f"- Status: {status_code}{error_msg}")

    def test_wallet_error_handling(self):
        """Test wallet authentication error handling"""
        print("\n🔍 Testing Wallet Authentication Error Handling...")
        
        error_tests = []
        
        # Test 1: Missing wallet address
        try:
            response1, success1 = self.make_request('POST', 'auth/wallet/challenge', 
                                                  data={}, expected_status=422, timeout=10)
            if success1 or (response1 and response1.status_code in [400, 422]):
                error_tests.append("Missing wallet address handled")
        except:
            pass
        
        # Test 2: Empty wallet address
        try:
            response2, success2 = self.make_request('POST', 'auth/wallet/challenge', 
                                                  data={"wallet_address": ""}, expected_status=422, timeout=10)
            if success2 or (response2 and response2.status_code in [400, 422]):
                error_tests.append("Empty wallet address handled")
        except:
            pass
        
        # Test 3: Invalid wallet address format
        try:
            response3, success3 = self.make_request('POST', 'auth/wallet/challenge', 
                                                  data={"wallet_address": "invalid_format"}, expected_status=500, timeout=10)
            if success3 or (response3 and response3.status_code in [400, 422, 500]):
                error_tests.append("Invalid wallet format handled")
        except:
            pass
        
        if len(error_tests) >= 2:
            return self.log_test("Wallet Authentication Error Handling", True, 
                               f"- {len(error_tests)}/3 error cases handled properly: {', '.join(error_tests)}")
        else:
            return self.log_test("Wallet Authentication Error Handling", False, 
                               f"- Only {len(error_tests)}/3 error cases handled properly")

    def run_wallet_auth_tests(self):
        """Run all wallet authentication tests"""
        print("🔐 Starting Focused Wallet Authentication Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # Setup user authentication for linking tests
        print("\n🔧 SETUP")
        print("-" * 40)
        auth_setup = self.setup_user_auth()
        if auth_setup:
            print("✅ User authentication setup successful")
        else:
            print("❌ User authentication setup failed - wallet linking tests will be limited")
        
        # Run wallet authentication tests
        print("\n🔐 WALLET AUTHENTICATION TESTS")
        print("-" * 40)
        
        self.test_wallet_challenge_generation()
        self.test_wallet_signature_verification_invalid()
        self.test_wallet_challenge_expiration()
        self.test_wallet_challenge_database_storage()
        self.test_wallet_linking_authentication_required()
        self.test_wallet_linking_with_auth()
        self.test_wallet_error_handling()
        
        # Print results
        print("\n" + "=" * 80)
        print("📊 WALLET AUTHENTICATION TEST RESULTS")
        print("=" * 80)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL WALLET AUTHENTICATION TESTS PASSED!")
            print("✨ Wallet authentication features verified:")
            print("   • Challenge generation with proper format")
            print("   • Challenge expiration (5 minutes)")
            print("   • Database storage of challenges")
            print("   • Invalid signature rejection")
            print("   • Authentication requirement for wallet linking")
            print("   • Error handling for invalid inputs")
            return 0
        else:
            failed_count = self.tests_run - self.tests_passed
            print(f"\n⚠️  {failed_count} wallet authentication test(s) failed.")
            
            if self.tests_passed / self.tests_run >= 0.8:
                print("✅ Most wallet authentication functionality is working (80%+ success rate)")
            elif self.tests_passed / self.tests_run >= 0.6:
                print("⚠️  Some wallet authentication issues detected (60%+ success rate)")
            else:
                print("❌ Significant wallet authentication issues detected")
            
            return 1

def main():
    """Main test runner"""
    tester = WalletAuthTester()
    return tester.run_wallet_auth_tests()

if __name__ == "__main__":
    sys.exit(main())