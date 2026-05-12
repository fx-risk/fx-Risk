from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import MarketIndicator
from ..schemas import MarketIndicatorOut, USMarketSnapshot
from ..services import fred

router = APIRouter(prefix="/api/market", tags=["market"])


def _is_cache_stale(db: Session) -> bool:
    latest = db.query(MarketIndicator).order_by(MarketIndicator.fetched_at.desc()).first()
    if not latest:
        return True
    return (datetime.utcnow() - latest.fetched_at) > timedelta(hours=settings.CACHE_TTL_HOURS)


def _to_out(row: MarketIndicator | None) -> MarketIndicatorOut | None:
    if row is None:
        return None
    return MarketIndicatorOut(series_id=row.series_id, date=row.date, value=row.value)


@router.get("/us", response_model=USMarketSnapshot)
async def get_us_snapshot(db: Session = Depends(get_db)):
    """美 시장 4개 지표의 최신 값."""
    if _is_cache_stale(db):
        try:
            await fred.refresh_all_series(db)
        except Exception as e:
            if not db.query(MarketIndicator).first():
                raise HTTPException(status_code=502, detail=f"FRED API 호출 실패: {e}")

    latest = fred.latest_per_series(db)
    return USMarketSnapshot(
        fed_funds_rate=_to_out(latest["fed_funds_rate"]),
        treasury_10y=_to_out(latest["treasury_10y"]),
        dollar_index=_to_out(latest["dollar_index"]),
        wti_oil=_to_out(latest["wti_oil"]),
    )


@router.post("/refresh")
async def force_refresh(db: Session = Depends(get_db)):
    count = await fred.refresh_all_series(db)
    return {"written": count}
