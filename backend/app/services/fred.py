"""FRED (St. Louis Fed) 시계열 데이터 클라이언트.

API 문서: https://fred.stlouisfed.org/docs/api/fred/series_observations.html

사용 시리즈:
- DFF        : 美 연방기금 실효금리 (Effective Federal Funds Rate)
- DGS10      : 美 10년 국채금리
- DTWEXBGS   : 무역가중 달러 인덱스 (Broad)
- DCOILWTICO : WTI 유가
"""
from datetime import date, timedelta

import httpx
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session

from ..config import settings
from ..models import MarketIndicator

FRED_URL = "https://api.stlouisfed.org/fred/series/observations"

SERIES = {
    "fed_funds_rate": "DFF",
    "treasury_10y": "DGS10",
    "dollar_index": "DTWEXBGS",
    "wti_oil": "DCOILWTICO",
}


async def fetch_series(series_id: str, days_back: int = 30) -> list[dict]:
    if not settings.FRED_API_KEY:
        raise RuntimeError("FRED_API_KEY가 설정되지 않았습니다. backend/.env 파일을 확인하세요.")

    start = (date.today() - timedelta(days=days_back)).strftime("%Y-%m-%d")
    params = {
        "series_id": series_id,
        "api_key": settings.FRED_API_KEY,
        "file_type": "json",
        "observation_start": start,
        "sort_order": "desc",
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(FRED_URL, params=params)
        resp.raise_for_status()
        return resp.json().get("observations", [])


async def refresh_all_series(db: Session, days_back: int = 30) -> int:
    written = 0
    for series_id in SERIES.values():
        observations = await fetch_series(series_id, days_back=days_back)
        for obs in observations:
            if obs.get("value") in (".", None, ""):
                continue
            try:
                value = float(obs["value"])
            except ValueError:
                continue
            obs_date = date.fromisoformat(obs["date"])
            stmt = insert(MarketIndicator).values(
                series_id=series_id, date=obs_date, value=value,
            ).on_conflict_do_update(
                index_elements=["series_id", "date"],
                set_=dict(value=value),
            )
            db.execute(stmt)
            written += 1
    db.commit()
    return written


def latest_per_series(db: Session) -> dict[str, MarketIndicator | None]:
    """각 시리즈의 가장 최근 관측치 반환."""
    result: dict[str, MarketIndicator | None] = {}
    for key, sid in SERIES.items():
        row = (
            db.query(MarketIndicator)
            .filter(MarketIndicator.series_id == sid)
            .order_by(MarketIndicator.date.desc())
            .first()
        )
        result[key] = row
    return result
