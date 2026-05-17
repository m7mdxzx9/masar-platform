from fastapi import APIRouter, HTTPException, Query, Response
import httpx
import logging

router = APIRouter(prefix="/calendar", tags=["calendar"])
logger = logging.getLogger(__name__)

@router.get("/ical")
async def get_calendar_ical(url: str = Query(..., description="The Blackboard ical URL")):
    """
    Proxy to fetch the Blackboard calendar ICS file to bypass CORS issues.
    Specifically for lms.uqu.edu.sa as per requirements.
    """
    if not url.startswith("https://") and not url.startswith("http://"):
        raise HTTPException(status_code=400, detail="Invalid URL protocol")
    
    # Blackboard URLs often use 'learn.uqu.edu.sa' or 'lms.uqu.edu.sa'
    if "uqu.edu.sa" not in url:
        raise HTTPException(status_code=400, detail="Only UQU Blackboard URLs are supported")

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url)
            response.raise_for_status()
            
            # Return as text/calendar
            return Response(content=response.text, media_type="text/calendar")
            
    except httpx.HTTPStatusError as e:
        logger.error(f"Blackboard API error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch calendar from Blackboard")
    except Exception as e:
        logger.error(f"Calendar fetch error: {e}")
        raise HTTPException(status_code=500, detail=f"خطأ في جلب التقويم: {str(e)}")
