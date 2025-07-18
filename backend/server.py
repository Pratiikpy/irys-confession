from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import asyncio
import json
import subprocess

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Irys Confession Board API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Data Models
class ConfessionCreate(BaseModel):
    content: str
    is_public: bool = True
    author: str = "anonymous"

class Confession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tx_id: str
    content: str
    is_public: bool
    author: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    upvotes: int = 0
    downvotes: int = 0
    gateway_url: str
    verified: bool = True

class VoteRequest(BaseModel):
    vote_type: str  # 'upvote' or 'downvote'
    user_address: str = "anonymous"

# Irys Service Helper
async def call_irys_service(request_data):
    """Call Node.js Irys service helper"""
    try:
        current_dir = os.path.dirname(__file__)
        irys_service_path = os.path.join(current_dir, 'irys_service.js')
        
        process = await asyncio.create_subprocess_exec(
            'node', irys_service_path,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=current_dir
        )
        
        stdout, stderr = await process.communicate(
            input=json.dumps(request_data).encode()
        )
        
        if process.returncode != 0:
            print(f"Node.js process error: {stderr.decode()}")
            return {"success": False, "error": "Irys service failed"}
        
        # Parse JSON response
        output_lines = stdout.decode().strip().split('\n')
        json_line = output_lines[-1].strip()
        
        if not json_line:
            return {"success": False, "error": "No response from Irys service"}
        
        return json.loads(json_line)
        
    except Exception as e:
        print(f"Error calling Irys service: {str(e)}")
        return {"success": False, "error": str(e)}

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Irys Confession Board API", "status": "running"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@api_router.get("/irys/network-info")
async def get_irys_network_info():
    """Get Irys network configuration"""
    return {
        "network": "devnet",
        "gateway_url": "https://devnet.irys.xyz",
        "rpc_url": "https://rpc.devnet.irys.xyz/v1",
        "explorer_url": "https://devnet.irys.xyz",
        "faucet_url": "https://faucet.devnet.irys.xyz"
    }

@api_router.post("/irys/upload")
async def upload_to_irys(data: dict):
    """Upload confession data to Irys"""
    try:
        request_data = {
            "action": "upload",
            "data": data.get("data"),
            "tags": data.get("tags", [])
        }
        
        result = await call_irys_service(request_data)
        
        if result.get("success"):
            return {
                "tx_id": result.get("tx_id"),
                "gateway_url": result.get("gateway_url"),
                "explorer_url": result.get("explorer_url"),
                "timestamp": result.get("timestamp"),
                "verified": True
            }
        else:
            raise HTTPException(status_code=400, detail=result.get("error"))
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/irys/balance")
async def get_irys_balance():
    """Get account balance on Irys"""
    try:
        result = await call_irys_service({"action": "balance"})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/irys/address")
async def get_irys_address():
    """Get Irys wallet address"""
    try:
        result = await call_irys_service({"action": "address"})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/confessions")
async def create_confession(confession: ConfessionCreate):
    """Create a new confession and upload to Irys"""
    try:
        # Validate confession content
        if not confession.content.strip():
            raise HTTPException(status_code=400, detail="Confession content cannot be empty")
        
        if len(confession.content) > 280:
            raise HTTPException(status_code=400, detail="Confession must be 280 characters or less")
        
        # Prepare data for Irys upload
        confession_data = {
            "content": confession.content,
            "is_public": confession.is_public,
            "timestamp": datetime.utcnow().isoformat(),
            "author": confession.author
        }
        
        # Prepare tags for Irys
        tags = [
            {"name": "Content-Type", "value": "confession"},
            {"name": "Public", "value": str(confession.is_public).lower()},
            {"name": "App", "value": "ZK-Confession"},
            {"name": "Timestamp", "value": str(int(datetime.utcnow().timestamp()))}
        ]
        
        # Upload to Irys
        irys_result = await call_irys_service({
            "action": "upload",
            "data": confession_data,
            "tags": tags
        })
        
        if not irys_result.get("success"):
            raise HTTPException(status_code=500, detail=f"Failed to upload to Irys: {irys_result.get('error')}")
        
        # Store confession metadata in database
        confession_doc = {
            "id": str(uuid.uuid4()),
            "tx_id": irys_result["tx_id"],
            "content": confession.content,
            "is_public": confession.is_public,
            "author": confession.author,
            "timestamp": datetime.utcnow(),
            "verified": True,
            "gateway_url": irys_result["gateway_url"],
            "upvotes": 0,
            "downvotes": 0
        }
        
        # Insert into database
        await db.confessions.insert_one(confession_doc)
        
        return {
            "status": "success",
            "id": confession_doc["id"],
            "tx_id": irys_result["tx_id"],
            "gateway_url": irys_result["gateway_url"],
            "share_url": f"/#/c/{irys_result['tx_id']}" + ("" if confession.is_public else f"#{confession.author}"),
            "verified": True,
            "message": "Confession posted successfully!"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/confessions/public")
async def get_public_confessions(limit: int = 50, offset: int = 0):
    """Get public confessions feed"""
    try:
        # Query database for public confessions
        cursor = db.confessions.find(
            {"is_public": True},
            {"_id": 0}
        ).sort("timestamp", -1).skip(offset).limit(limit)
        
        confessions = await cursor.to_list(length=limit)
        
        return {
            "confessions": confessions,
            "count": len(confessions),
            "offset": offset,
            "limit": limit
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/confessions/{tx_id}")
async def get_confession(tx_id: str):
    """Get specific confession by transaction ID"""
    try:
        # First check our database
        confession = await db.confessions.find_one(
            {"tx_id": tx_id},
            {"_id": 0}
        )
        
        if not confession:
            raise HTTPException(status_code=404, detail="Confession not found")
        
        return confession
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/confessions/{tx_id}/vote")
async def vote_confession(tx_id: str, vote_request: VoteRequest):
    """Vote on a confession"""
    try:
        if vote_request.vote_type not in ["upvote", "downvote"]:
            raise HTTPException(status_code=400, detail="Invalid vote type")
        
        # Check if confession exists
        confession = await db.confessions.find_one({"tx_id": tx_id})
        if not confession:
            raise HTTPException(status_code=404, detail="Confession not found")
        
        # Check if user already voted
        existing_vote = await db.votes.find_one({
            "tx_id": tx_id,
            "user_address": vote_request.user_address
        })
        
        if existing_vote:
            raise HTTPException(status_code=400, detail="User already voted")
        
        # Record vote
        vote_doc = {
            "id": str(uuid.uuid4()),
            "tx_id": tx_id,
            "user_address": vote_request.user_address,
            "vote_type": vote_request.vote_type,
            "timestamp": datetime.utcnow()
        }
        
        await db.votes.insert_one(vote_doc)
        
        # Update confession vote count
        update_field = "upvotes" if vote_request.vote_type == "upvote" else "downvotes"
        await db.confessions.update_one(
            {"tx_id": tx_id},
            {"$inc": {update_field: 1}}
        )
        
        return {"status": "success", "message": f"{vote_request.vote_type} recorded"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/trending")
async def get_trending_confessions(limit: int = 20):
    """Get trending confessions (most upvoted)"""
    try:
        cursor = db.confessions.find(
            {"is_public": True},
            {"_id": 0}
        ).sort("upvotes", -1).limit(limit)
        
        confessions = await cursor.to_list(length=limit)
        
        return {
            "confessions": confessions,
            "count": len(confessions)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)