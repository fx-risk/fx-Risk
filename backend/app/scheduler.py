"""매일 새벽 자동 데이터 갱신 + 영업일 업무시간 30분 간격 갱신 스케줄러.

스케줄:
- 매일 04:00 KST: 전일 데이터를 새벽에 한 번에 채워둠 (사용자가 출근 전 캐시 완성)
- 평일(월~금) 08:00 ~ 16:00 KST 매 30분: 업무시간 중 실시간성 유지 (장중 변동 반영)
"""
import logging
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from pytz import timezone as pytz_timezone

from .db import SessionLocal
from .services import ecos, fred

# uvicorn 로거를 사용해 docker compose logs에 즉시 노출되도록 함
# (logging.getLogger(__name__)은 uvicorn 기본 설정에서 출력 안 됨)
log = logging.getLogger("uvicorn.error")
log.setLevel(logging.INFO)


def report(msg: str):
    """stdout으로 직접 출력 + 로거에도 기록 — docker logs 가시성 보장."""
    print(msg, flush=True)
    log.info(msg)

KST = pytz_timezone("Asia/Seoul")
scheduler = AsyncIOScheduler(timezone=KST)


async def _refresh_both(label: str):
    """ECOS USD/KRW + FRED 美 시장 지표 모두 갱신, 결과를 한 줄 리포트로 로깅."""
    db = SessionLocal()
    started = datetime.now(KST)
    ecos_count = 0
    fred_count = 0
    ecos_err = None
    fred_err = None
    try:
        try:
            ecos_count = await ecos.refresh_recent(db, days_back=10)
        except Exception as e:
            ecos_err = str(e)

        try:
            fred_count = await fred.refresh_all_series(db, days_back=30)
        except Exception as e:
            fred_err = str(e)
    finally:
        db.close()

    elapsed = (datetime.now(KST) - started).total_seconds()
    status_ecos = f"{ecos_count} rows" if ecos_err is None else f"FAILED ({ecos_err})"
    status_fred = f"{fred_count} rows" if fred_err is None else f"FAILED ({fred_err})"

    # 운영자가 보기 쉬운 단일 라인 리포트
    report(
        f"[refresh-report] {label} | when={started.strftime('%Y-%m-%d %H:%M:%S')} KST "
        f"| ecos={status_ecos} | fred={status_fred} | elapsed={elapsed:.2f}s"
    )


async def daily_refresh():
    """매일 04:00 KST 정기 갱신."""
    await _refresh_both("DAILY-04KST")


async def business_hours_refresh():
    """평일 업무시간(08-16시 KST) 30분 간격 갱신."""
    await _refresh_both("BUSINESS-HRS")


def start():
    # ① 매일 04:00 KST — 일일 정기 갱신
    scheduler.add_job(
        daily_refresh,
        CronTrigger(hour=4, minute=0, timezone=KST),
        id="daily_refresh",
        replace_existing=True,
    )

    # ② 평일(월~금) 08:00 ~ 16:00 KST 매 30분 — 업무시간 갱신
    #    포함되는 실행 시각: 08:00, 08:30, 09:00, ... 16:00, 16:30 (총 18회/일)
    #    "오후 4시까지" 엄격 해석이 필요하면 hour='8-15' + 별도 16:00 job으로 변경
    scheduler.add_job(
        business_hours_refresh,
        CronTrigger(
            day_of_week="mon-fri",
            hour="8-16",
            minute="0,30",
            timezone=KST,
        ),
        id="business_hours_refresh",
        replace_existing=True,
    )

    scheduler.start()
    report(
        "[scheduler] started — daily@04:00 KST, "
        "business-hours mon-fri 08:00-16:30 KST every 30min"
    )


def stop():
    if scheduler.running:
        scheduler.shutdown()
