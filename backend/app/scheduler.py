"""매일 새벽 자동 데이터 갱신 스케줄러.

배포 환경에서 사용자가 처음 접속하기 전에 미리 캐시를 채워둔다.
"""
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from .db import SessionLocal
from .services import ecos, fred

log = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def daily_refresh():
    """ECOS USD/KRW + FRED 美 시장 지표 모두 갱신."""
    db = SessionLocal()
    try:
        try:
            ecos_count = await ecos.refresh_recent(db, days_back=10)
            log.info("[scheduler] ECOS refreshed: %d rows", ecos_count)
        except Exception as e:
            log.warning("[scheduler] ECOS refresh failed: %s", e)

        try:
            fred_count = await fred.refresh_all_series(db, days_back=30)
            log.info("[scheduler] FRED refreshed: %d rows", fred_count)
        except Exception as e:
            log.warning("[scheduler] FRED refresh failed: %s", e)
    finally:
        db.close()


def start():
    # 매일 04:00 KST (서울 기준 새벽). 한국은행 ECOS는 영업일 갱신,
    # FRED는 미국 시간대 기준이라 04시면 전일 데이터 충분히 들어와 있다.
    scheduler.add_job(
        daily_refresh,
        CronTrigger(hour=4, minute=0),
        id="daily_refresh",
        replace_existing=True,
    )
    scheduler.start()
    log.info("[scheduler] started — daily refresh at 04:00")


def stop():
    if scheduler.running:
        scheduler.shutdown()
