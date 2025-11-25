from fastapi import APIRouter, Request, HTTPException
import httpx
import os

router = APIRouter(prefix="/gateway", tags=["Gateway"])

ML_SERVICE_URL = os.getenv("GATEWAY_ML_URL")  # e.g., http://ml-service:8001
ANALYTICS_SERVICE_URL = os.getenv("GATEWAY_ANALYTICS_URL")  # e.g., http://analytics-service:8002

async def _proxy(request: Request, target_base: str, path_suffix: str):
    url = f"{target_base.rstrip('/')}/{path_suffix.lstrip('/')}"
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.request(
                request.method,
                url,
                headers={k: v for k, v in request.headers.items() if k.lower() != "host"},
                content=await request.body(),
                params=request.query_params,
            )
            return router.response_class(
                content=resp.content,
                status_code=resp.status_code,
                headers=dict(resp.headers),
                media_type=resp.headers.get("content-type"),
            )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {str(e)}")

@router.api_route("/ml/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH"])
async def proxy_ml(request: Request, path: str):
    if not ML_SERVICE_URL:
        raise HTTPException(status_code=501, detail="ML gateway not configured")
    return await _proxy(request, ML_SERVICE_URL, path)

@router.api_route("/analytics/{path:path}", methods=["GET","POST","PUT","DELETE","PATCH"])
async def proxy_analytics(request: Request, path: str):
    if not ANALYTICS_SERVICE_URL:
        raise HTTPException(status_code=501, detail="Analytics gateway not configured")
    return await _proxy(request, ANALYTICS_SERVICE_URL, path)

