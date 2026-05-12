"""한국은행 ECOS (경제통계시스템) API 클라이언트.

API 문서: https://ecos.bok.or.kr/api/

USD/KRW 매매기준율
- 통계표 코드: 731Y001 (시장환율 - 1일)
- 통계항목 코드: 0000001 (원/달러)
- 주기: D (일별)

엔드포인트:
GET /api/StatisticSearch/{KEY}/json/kr/{시작}/{끝}/{통계표}/{주기}/{시작일}/{종료일}/{항목코드}

특징:
- 한 번의 호출로 날짜 범위 데이터를 받을 수 있어 수출입은행 API 대비 호출 효율이 좋음
- 매영업일 갱신, 주말/공휴일은 데이터 없음
"""
from datetime import date, timedelta

import httpx
from sqlalchemy.dialects.sqlite import insert
from sqlalchemy.orm import Session

from ..config import settings
from ..models import ExchangeRate

ECOS_BASE = "https://ecos.bok.or.kr/api/StatisticSearch"
STAT_CODE = "731Y001"        # 시장환율 - 1일
ITEM_CODE = "0000001"        # 원/달러
PERIOD = "D"                  # 일별


async def fetch_rates_range(start: date, end: date) -> list[dict]:
    """주어진 날짜 범위의 USD/KRW 매매기준율 리스트를 받아온다.

    응답 row 예시:
        {"TIME": "20240501", "DATA_VALUE": "1356.7", "UNIT_NAME": "원", ...}
    """
    if not settings.ECOS_API_KEY:
        raise RuntimeError("ECOS_API_KEY가 설정되지 않았습니다. backend/.env 파일을 확인하세요.")

    url = (
        f"{ECOS_BASE}/{settings.ECOS_API_KEY}/json/kr/1/1000/"
        f"{STAT_CODE}/{PERIOD}/{start.strftime('%Y%m%d')}/{end.strftime('%Y%m%d')}/{ITEM_CODE}"
    )
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()

    # ECOS는 에러 시 최상위 RESULT 키 반환
    if "RESULT" in data:
        result = data["RESULT"]
        raise RuntimeError(f"ECOS API 오류: [{result.get('CODE')}] {result.get('MESSAGE')}")

    rows = data.get("StatisticSearch", {}).get("row", [])
    return rows


async def refresh_recent(db: Session, days_back: int = 90) -> int:
    """최근 N일 환율을 한 번에 받아 DB에 upsert. 추가/갱신된 행 수 반환."""
    end = date.today()
    start = end - timedelta(days=days_back)
    rows = await fetch_rates_range(start, end)

    written = 0
    for row in rows:
        time_str = row.get("TIME")
        value_str = row.get("DATA_VALUE")
        if not time_str or not value_str:
            continue
        try:
            d = date(int(time_str[0:4]), int(time_str[4:6]), int(time_str[6:8]))
            base_rate = float(value_str)
        except (ValueError, IndexError):
            continue

        stmt = insert(ExchangeRate).values(
            date=d,
            currency="USD",
            base_rate=base_rate,
        ).on_conflict_do_update(
            index_elements=["date", "currency"],
            set_=dict(base_rate=base_rate),
        )
        db.execute(stmt)
        written += 1

    db.commit()
    return written


def calculate_moving_averages(rates) -> list[dict]:
    """오름차순 날짜 순으로 받은 rates에 대해 5/20/60일 이동평균을 계산."""
    rate_list = sorted(rates, key=lambda r: r.date)
    values = [r.base_rate for r in rate_list]
    result = []
    for i, r in enumerate(rate_list):
        def avg(window: int) -> float | None:
            if i + 1 < window:
                return None
            return round(sum(values[i + 1 - window : i + 1]) / window, 2)
        result.append({
            "date": r.date,
            "rate": r.base_rate,
            "ma5": avg(5),
            "ma20": avg(20),
            "ma60": avg(60),
        })
    return result
