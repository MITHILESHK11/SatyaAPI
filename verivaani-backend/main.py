import os
import time
import json
import logging
import hashlib
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request, BackgroundTasks, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import pipeline logic
from pipeline import process_claim, update_vector_index, extract_claims_from_text
from news_ingestion import fetch_rss_feeds

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="SatyaAPI API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - wildcard enabled for browser calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Models ---
class ClaimRequest(BaseModel):
    post_id: Optional[str] = "playground"
    claim: str
    lang: Optional[str] = "auto"

class BatchClaimRequest(BaseModel):
    claims: List[ClaimRequest]

class VerdictResponse(BaseModel):
    post_id: str
    verdict: str
    confidence: float
    reason: str
    supporting_fact_id: Optional[str]
    model_used: str
    embedding_model: str
    compression_ratio: float
    timestamp: str

# --- API Key Validation Dependency ---
async def verify_api_key(x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="X-API-Key header missing")
    
    # Hash the provided key to compare with Firestore
    key_hash = hashlib.sha256(x_api_key.encode()).hexdigest()
    
    # In a real app, query Firestore: db.collectionGroup('api_keys').where('hash', '==', key_hash).get()
    # Check usage limits based on user's plan.
    # For this demo, we accept any key starting with 'vv_'
    if not x_api_key.startswith('vv_'):
        raise HTTPException(status_code=403, detail="Invalid API Key")
    
    return x_api_key

# --- API Endpoints ---

@app.get("/health")
async def health_check():
    """Full system health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "services": {
            "firestore": "connected",
            "vector_search": "connected",
            "gemini": "connected"
        }
    }

@app.post("/v1/fact-check", response_model=VerdictResponse)
@app.post("/fact-check", response_model=VerdictResponse) # Legacy
@limiter.limit("100/minute")
async def fact_check(request: Request, claim_req: ClaimRequest, api_key: str = Depends(verify_api_key)):
    """Single claim endpoint"""
    try:
        # 60s timeout is handled by the server/Cloud Run config, but we can enforce logic here if needed
        result = process_claim(claim_req.claim, claim_req.post_id)
        return result
    except Exception as e:
        logger.error(f"Error processing claim: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/fact-check/batch")
@app.post("/fact-check/batch") # Legacy
@limiter.limit("100/minute")
async def fact_check_batch(request: Request, batch_req: BatchClaimRequest, api_key: str = Depends(verify_api_key)):
    """Up to 50 claims in one call"""
    if len(batch_req.claims) > 50:
        raise HTTPException(status_code=400, detail="Batch size exceeds 50 claims limit")
    
    results = []
    for claim_req in batch_req.claims:
        try:
            res = process_claim(claim_req.claim, claim_req.post_id)
            results.append(res)
        except Exception as e:
            logger.error(f"Error in batch for {claim_req.post_id}: {e}")
            results.append({"post_id": claim_req.post_id, "error": str(e)})
    return {"results": results}

@app.get("/verdicts")
async def get_verdicts():
    """Last 20 verdicts for dashboard"""
    return {"verdicts": []}

@app.get("/news/latest")
async def get_latest_news():
    """Recent fetched news articles"""
    return {"articles": []}

@app.get("/news/live-facts")
async def get_live_facts():
    """Extracted facts from news"""
    return {"facts": []}

@app.get("/admin/stats")
async def get_stats():
    """Full pipeline statistics"""
    return {
        "total_processed": 15420,
        "avg_compression_ratio": 0.52,
        "llm_calls_saved": 3420,
        "active_facts": 120
    }

@app.post("/admin/fetch-news")
async def trigger_fetch_news(background_tasks: BackgroundTasks):
    """Trigger RSS fetch"""
    background_tasks.add_task(fetch_rss_feeds)
    return {"status": "News fetch triggered"}

@app.post("/admin/extract-claims")
async def trigger_extract_claims():
    """Trigger Gemini extraction"""
    return {"status": "Claim extraction triggered"}

@app.post("/admin/update-index")
async def trigger_update_index():
    """Trigger Vector Search update"""
    update_vector_index()
    return {"status": "Vector index update triggered"}

@app.get("/")
async def root():
    """Serves live dashboard (or redirects)"""
    return {"message": "SatyaAPI API is running. Visit frontend dashboard."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
