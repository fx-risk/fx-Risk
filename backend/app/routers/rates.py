from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..config import settings
from ..db import get_db
from ..models import ExchangeRate
from ..schemas import ExchangeRateOut, MovingAveragesOut
from ..services import ecos

router = APIRouter(prefix="/api/rates", tags=["rates"])


def _is_cache_stale(db: Session) -> bool:
    latest = db.query(ExchangeRate).order_by(ExchangeRate.fetched_at.desc()).first()
    if not latest:
        return True
    age = datetime.utcnow() - latest.fetched_at
    return age > timedelta(hours=settings.CACHE_TTL_HOURS)


@router.get("/latest", response_model=ExchangeRateOut)
async def get_latest_rate(db: Session = Depends(get_db)):
    """최신 USD/KRW 환율. 캐시가 stale하면 외부 API로 갱신."""
    if _is_cache_stale(db):
        try:
            await ecos.refresh_recent(db, days_back=7)
        except Exception as e:
            if not db.query(ExchangeRate).first():
                raise HTTPException(status_code=502, detail=f"환율 API 호출 실패: {e}")

    latest = (
        db.query(ExchangeRate)
        .filter(ExchangeRate.currency == "USD")
        .order_by(ExchangeRate.date.desc())
        .first()
    )
    if not latest:
        raise HTTPException(status_code=404, detail="환율 데이터가 없습니다.")
    return latest


@router.get("/history", response_model=list[MovingAveragesOut])
async def get_rate_history(
    days: int = Query(90, ge=10, le=365),
    db: Session = Depends(get_db),
):
    """최근 N일 환율 + 5/20/60일 이동평균. MA 계산에 60일 버퍼 추가."""
    if _is_cache_stale(db):
        try:
            await ecos.refresh_recent(db, days_back=max(days + 60, 90))
        except Exception:
            pass

    rates = (
        db.query(ExchangeRate)
        .filter(ExchangeRate.currency == "USD")
        .order_by(ExchangeRate.date.asc())
        .all()
    )
    result = ecos.calculate_moving_averages(rates)
    return result[-days:] if len(result) > days else result


@router.post("/refresh")
async def force_refresh(days_back: int = 30, db: Session = Depends(get_db)):
    """수동으로 환율 캐시 강제 갱신."""
    count = await ecos.refresh_recent(db, days_back=days_back)
    return {"written": count}
