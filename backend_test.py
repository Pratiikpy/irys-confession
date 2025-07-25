#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Irys Confession Board
Tests all endpoints using the public URL including enhanced features:
- User Authentication System
- Enhanced Confession System with AI Analysis
- Reply System with Threading
- Voting System
- Advanced Search
- AI Content Moderation
- Real-time Features
- Analytics
- Irys Integration
"""

import requests
import json
import sys
from datetime import datetime
import time
import websocket
import threading

class IrysConfessionAPITester:
    def __init__(self, base_url="https://07dc0b05-7562-4f0a-a3bf-31a5cb981e46.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_confession_id = None
        self.created_tx_id = None
        self.access_token = None
        self.user_id = None
        self.created_reply_id = None

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

    def test_root_endpoint(self):
        """Test GET /api/"""
        print("\n🔍 Testing Root API Endpoint...")
        response, success = self.make_request('GET', '', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                has_message = 'message' in data and 'Irys Confession Board API' in data['message']
                has_status = 'status' in data and data['status'] == 'running'
                has_version = 'version' in data
                
                if has_message and has_status and has_version:
                    return self.log_test("Root API Endpoint", True, f"- Version: {data['version']}")
                else:
                    return self.log_test("Root API Endpoint", False, "- Missing required fields")
            except json.JSONDecodeError:
                return self.log_test("Root API Endpoint", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Root API Endpoint", False, f"- Status: {status_code}")

    def test_user_registration(self):
        """Test POST /api/auth/register"""
        print("\n🔍 Testing User Registration...")
        
        # Generate unique username with timestamp
        timestamp = int(time.time())
        test_user = {
            "username": f"testuser_{timestamp}",
            "email": f"test_{timestamp}@example.com",
            "password": "SecurePassword123!",
            "wallet_address": "0x1234567890abcdef1234567890abcdef12345678"
        }
        
        response, success = self.make_request('POST', 'auth/register', data=test_user, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['access_token', 'token_type', 'user']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('token_type') == 'bearer':
                    self.access_token = data.get('access_token')
                    user_data = data.get('user', {})
                    self.user_id = user_data.get('id')
                    return self.log_test("User Registration", True, f"- User: {user_data.get('username')}, ID: {self.user_id}")
                else:
                    return self.log_test("User Registration", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("User Registration", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("User Registration", False, f"- Status: {status_code}{error_msg}")

    def test_user_login(self):
        """Test POST /api/auth/login"""
        if not self.access_token:
            return self.log_test("User Login", False, "- No user registered (registration failed)")
        
        print("\n🔍 Testing User Login...")
        
        # Use the same credentials from registration
        timestamp = int(time.time())
        login_data = {
            "username": f"testuser_{timestamp}",
            "password": "SecurePassword123!"
        }
        
        response, success = self.make_request('POST', 'auth/login', data=login_data, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['access_token', 'token_type', 'user']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('token_type') == 'bearer':
                    # Update token with fresh login token
                    self.access_token = data.get('access_token')
                    return self.log_test("User Login", True, f"- Login successful")
                else:
                    return self.log_test("User Login", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("User Login", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("User Login", False, f"- Status: {status_code}")

    def test_get_user_profile(self):
        """Test GET /api/auth/me"""
        if not self.access_token:
            return self.log_test("Get User Profile", False, "- No access token (login failed)")
        
        print("\n🔍 Testing Get User Profile...")
        response, success = self.make_request('GET', 'auth/me', auth=True, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['id', 'username', 'stats', 'preferences', 'verification', 'reputation']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    return self.log_test("Get User Profile", True, f"- User: {data.get('username')}")
                else:
                    return self.log_test("Get User Profile", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Get User Profile", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Get User Profile", False, f"- Status: {status_code}")

    def test_update_user_preferences(self):
        """Test PUT /api/auth/preferences"""
        if not self.access_token:
            return self.log_test("Update User Preferences", False, "- No access token (login failed)")
        
        print("\n🔍 Testing Update User Preferences...")
        
        preferences_data = {
            "theme": "light",
            "notifications": False,
            "privacy_level": "private",
            "email_notifications": False,
            "crisis_support": True
        }
        
        response, success = self.make_request('PUT', 'auth/preferences', data=preferences_data, auth=True, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                if 'message' in data and 'updated' in data['message'].lower():
                    return self.log_test("Update User Preferences", True, f"- {data.get('message')}")
                else:
                    return self.log_test("Update User Preferences", False, f"- Unexpected response: {data}")
            except json.JSONDecodeError:
                return self.log_test("Update User Preferences", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Update User Preferences", False, f"- Status: {status_code}")

    def test_create_confession_with_ai(self):
        """Test POST /api/confessions with AI analysis"""
        print("\n🔍 Testing Create Confession with AI Analysis...")
        
        test_confession = {
            "content": "I'm feeling really anxious about my upcoming job interview. I've been preparing for weeks but I still feel overwhelmed and worried I won't be good enough.",
            "is_public": True,
            "author": "anonymous",
            "mood": "anxious",
            "tags": ["career", "anxiety", "interview"]
        }
        
        response, success = self.make_request('POST', 'confessions', data=test_confession, auth=True, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['status', 'id', 'tx_id', 'gateway_url', 'verified', 'ai_analysis']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('status') == 'success':
                    self.created_confession_id = data.get('id')
                    self.created_tx_id = data.get('tx_id')
                    ai_analysis = data.get('ai_analysis', {})
                    has_moderation = 'moderation' in ai_analysis
                    has_enhancement = 'enhancement' in ai_analysis
                    
                    return self.log_test("Create Confession with AI", True, 
                                       f"- ID: {self.created_confession_id}, AI Analysis: {has_moderation and has_enhancement}")
                else:
                    return self.log_test("Create Confession with AI", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Create Confession with AI", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Create Confession with AI", False, f"- Status: {status_code}{error_msg}")

    def test_create_reply(self):
        """Test POST /api/confessions/{confession_id}/replies"""
        if not self.created_confession_id:
            return self.log_test("Create Reply", False, "- No confession ID available (create confession failed)")
        
        print(f"\n🔍 Testing Create Reply to Confession...")
        
        reply_data = {
            "content": "I understand how you feel! Job interviews can be really stressful. Remember that you've prepared well and that's what matters most. Good luck!",
            "parent_reply_id": None
        }
        
        response, success = self.make_request('POST', f'confessions/{self.created_confession_id}/replies', 
                                            data=reply_data, auth=True, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['status', 'id', 'message']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('status') == 'success':
                    self.created_reply_id = data.get('id')
                    return self.log_test("Create Reply", True, f"- Reply ID: {self.created_reply_id}")
                else:
                    return self.log_test("Create Reply", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Create Reply", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Create Reply", False, f"- Status: {status_code}")

    def test_get_replies(self):
        """Test GET /api/confessions/{confession_id}/replies"""
        if not self.created_confession_id:
            return self.log_test("Get Replies", False, "- No confession ID available")
        
        print(f"\n🔍 Testing Get Replies...")
        response, success = self.make_request('GET', f'confessions/{self.created_confession_id}/replies', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['replies', 'count', 'offset', 'limit']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    replies = data.get('replies', [])
                    count = len(replies)
                    return self.log_test("Get Replies", True, f"- Found {count} replies")
                else:
                    return self.log_test("Get Replies", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Get Replies", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Get Replies", False, f"- Status: {status_code}")

    def test_vote_reply(self):
        """Test POST /api/replies/{reply_id}/vote"""
        if not self.created_reply_id:
            return self.log_test("Vote Reply", False, "- No reply ID available")
        
        print(f"\n🔍 Testing Vote on Reply...")
        
        vote_data = {
            "vote_type": "upvote",
            "user_address": "test_voter_reply"
        }
        
        response, success = self.make_request('POST', f'replies/{self.created_reply_id}/vote', 
                                            data=vote_data, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                if data.get('status') == 'success' and 'upvote recorded' in data.get('message', ''):
                    return self.log_test("Vote Reply", True, f"- Vote recorded: {data.get('message')}")
                else:
                    return self.log_test("Vote Reply", False, f"- Unexpected response: {data}")
            except json.JSONDecodeError:
                return self.log_test("Vote Reply", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Vote Reply", False, f"- Status: {status_code}")

    def test_advanced_search(self):
        """Test POST /api/search"""
        print("\n🔍 Testing Advanced Search...")
        
        search_data = {
            "query": "anxious",
            "mood": "anxious",
            "tags": ["anxiety"],
            "sort_by": "timestamp",
            "order": "desc"
        }
        
        response, success = self.make_request('POST', 'search', data=search_data, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['confessions', 'count', 'query']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    confessions = data.get('confessions', [])
                    count = len(confessions)
                    return self.log_test("Advanced Search", True, f"- Found {count} matching confessions")
                else:
                    return self.log_test("Advanced Search", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Advanced Search", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Advanced Search", False, f"- Status: {status_code}")

    def test_trending_tags(self):
        """Test GET /api/tags/trending"""
        print("\n🔍 Testing Trending Tags...")
        response, success = self.make_request('GET', 'tags/trending?limit=10', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['tags', 'count']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    tags = data.get('tags', [])
                    count = len(tags)
                    return self.log_test("Trending Tags", True, f"- Found {count} trending tags")
                else:
                    return self.log_test("Trending Tags", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Trending Tags", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Trending Tags", False, f"- Status: {status_code}")

    def test_analytics_stats(self):
        """Test GET /api/analytics/stats"""
        print("\n🔍 Testing Analytics Stats...")
        response, success = self.make_request('GET', 'analytics/stats', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['total_confessions', 'public_confessions', 'total_users', 'total_replies']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    stats = {
                        'confessions': data.get('total_confessions'),
                        'users': data.get('total_users'),
                        'replies': data.get('total_replies')
                    }
                    return self.log_test("Analytics Stats", True, f"- Stats: {stats}")
                else:
                    return self.log_test("Analytics Stats", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Analytics Stats", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Analytics Stats", False, f"- Status: {status_code}")

    def test_irys_balance(self):
        """Test GET /api/irys/balance"""
        print("\n🔍 Testing Irys Balance...")
        response, success = self.make_request('GET', 'irys/balance', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                # Any response is considered valid for balance check
                return self.log_test("Irys Balance", True, f"- Response: {str(data)[:100]}...")
            except json.JSONDecodeError:
                return self.log_test("Irys Balance", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Irys Balance", False, f"- Status: {status_code}")

    def test_verify_transaction(self):
        """Test GET /api/verify/{tx_id}"""
        if not self.created_tx_id:
            return self.log_test("Verify Transaction", False, "- No transaction ID available")
        
        print(f"\n🔍 Testing Verify Transaction (TX: {self.created_tx_id})...")
        response, success = self.make_request('GET', f'verify/{self.created_tx_id}', expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                if data.get('verified') == True and data.get('type') == 'confession':
                    return self.log_test("Verify Transaction", True, f"- Transaction verified: {data.get('type')}")
                else:
                    return self.log_test("Verify Transaction", False, f"- Transaction not verified or wrong type")
            except json.JSONDecodeError:
                return self.log_test("Verify Transaction", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            return self.log_test("Verify Transaction", False, f"- Status: {status_code}")

    def test_websocket_connection(self):
        """Test WebSocket connection"""
        print("\n🔍 Testing WebSocket Connection...")
        
        try:
            # Extract base URL without /api
            ws_base = self.base_url.replace('/api', '').replace('https://', 'wss://').replace('http://', 'ws://')
            ws_url = f"{ws_base}/ws/test_user_123"
            
            # Simple connection test
            ws = websocket.create_connection(ws_url, timeout=5)
            ws.send("test message")
            result = ws.recv()
            ws.close()
            
            return self.log_test("WebSocket Connection", True, "- Connection established and message sent")
            
        except Exception as e:
            return self.log_test("WebSocket Connection", False, f"- Connection failed: {str(e)}")
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

    def test_create_confession_anonymous(self):
        """Test POST /api/confessions (anonymous)"""
        print("\n🔍 Testing Create Anonymous Confession...")
        
        test_confession = {
            "content": "This is an anonymous test confession from the testing agent",
            "is_public": True,
            "author": "anonymous"
        }
        
        response, success = self.make_request('POST', 'confessions', data=test_confession, expected_status=200)
        
        if success and response:
            try:
                data = response.json()
                required_fields = ['status', 'id', 'tx_id', 'gateway_url', 'verified']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields and data.get('status') == 'success':
                    # Store for later tests if we don't have one from authenticated user
                    if not self.created_confession_id:
                        self.created_confession_id = data.get('id')
                        self.created_tx_id = data.get('tx_id')
                    return self.log_test("Create Anonymous Confession", True, f"- ID: {data.get('id')}")
                else:
                    return self.log_test("Create Anonymous Confession", False, f"- Missing fields: {missing_fields}")
            except json.JSONDecodeError:
                return self.log_test("Create Anonymous Confession", False, "- Invalid JSON response")
        else:
            status_code = response.status_code if response else "No response"
            error_msg = ""
            if response:
                try:
                    error_data = response.json()
                    error_msg = f" - Error: {error_data.get('detail', 'Unknown error')}"
                except:
                    error_msg = f" - Response: {response.text[:200]}"
            return self.log_test("Create Anonymous Confession", False, f"- Status: {status_code}{error_msg}")

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

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Comprehensive Irys Confession Board API Tests")
        print(f"📡 Testing against: {self.base_url}")
        print("=" * 80)
        
        # 1. Basic API Health Tests
        print("\n📋 BASIC API & HEALTH TESTS")
        print("-" * 40)
        self.test_root_endpoint()
        self.test_health_check()
        
        # 2. User Authentication System Tests
        print("\n👤 USER AUTHENTICATION SYSTEM TESTS")
        print("-" * 40)
        self.test_user_registration()
        self.test_user_login()
        self.test_get_user_profile()
        self.test_update_user_preferences()
        
        # 3. Enhanced Confession System Tests
        print("\n📝 ENHANCED CONFESSION SYSTEM TESTS")
        print("-" * 40)
        self.test_create_confession_with_ai()
        self.test_create_confession_anonymous()  # Fallback for other tests
        
        # Wait for confession processing
        if self.created_tx_id:
            print("\n⏳ Waiting 3 seconds for confession processing...")
            time.sleep(3)
        
        self.test_get_public_confessions()
        self.test_get_specific_confession()
        
        # 4. Reply System Tests
        print("\n💬 REPLY SYSTEM TESTS")
        print("-" * 40)
        self.test_create_reply()
        self.test_get_replies()
        
        # 5. Voting System Tests
        print("\n🗳️ VOTING SYSTEM TESTS")
        print("-" * 40)
        self.test_vote_confession()
        self.test_vote_reply()
        
        # 6. Advanced Search Tests
        print("\n🔍 ADVANCED SEARCH TESTS")
        print("-" * 40)
        self.test_advanced_search()
        self.test_get_trending()
        self.test_trending_tags()
        
        # 7. Analytics Tests
        print("\n📊 ANALYTICS TESTS")
        print("-" * 40)
        self.test_analytics_stats()
        
        # 8. Irys Integration Tests
        print("\n🔗 IRYS INTEGRATION TESTS")
        print("-" * 40)
        self.test_irys_network_info()
        self.test_irys_address()
        self.test_irys_balance()
        self.test_verify_transaction()
        
        # 9. Real-time Features Tests
        print("\n⚡ REAL-TIME FEATURES TESTS")
        print("-" * 40)
        self.test_websocket_connection()
        
        # Print final results
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST RESULTS SUMMARY")
        print("=" * 80)
        print(f"✅ Tests Passed: {self.tests_passed}")
        print(f"❌ Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Detailed breakdown
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL TESTS PASSED! Backend API is fully functional.")
            print("✨ Features verified:")
            print("   • User Authentication System")
            print("   • Enhanced Confession System with AI Analysis")
            print("   • Reply System with Threading")
            print("   • Voting System")
            print("   • Advanced Search & Filtering")
            print("   • Analytics & Trending")
            print("   • Irys Blockchain Integration")
            print("   • Real-time WebSocket Features")
            return 0
        else:
            failed_count = self.tests_run - self.tests_passed
            print(f"\n⚠️  {failed_count} test(s) failed. Check the logs above for details.")
            
            if self.tests_passed / self.tests_run >= 0.8:
                print("✅ Most core functionality is working (80%+ success rate)")
            elif self.tests_passed / self.tests_run >= 0.6:
                print("⚠️  Some issues detected but basic functionality works (60%+ success rate)")
            else:
                print("❌ Significant issues detected - major functionality problems")
            
            return 1

def main():
    """Main test runner"""
    tester = IrysConfessionAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())