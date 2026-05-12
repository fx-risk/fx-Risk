from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Date, UniqueConstraint

from .db import Base


class ExchangeRate(Base):
    """일별 USD/KRW 환율 (한국수출입은행 매매기준율)."""
    __tablename__ = "exchange_rates"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, index=True)
    currency = Column(String(8), nullable=False, default="USD")
    base_rate = Column(Float, nullable=False)        # 매매기준율
    buy_cash = Column(Float)                          # 현찰 살 때
    sell_cash = Column(Float)                         # 현찰 팔 때
    tt_buy = Column(Float)                            # 송금 받을 때
    tt_sell = Column(Float)                           # 송금 보낼 때
    fetched_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("date", "currency", name="uq_rate_date_currency"),)


class MarketIndicator(Base):
    """FRED 시계열 데이터 — 美 금리, 달러 인덱스, 유가 등."""
    __tablename__ = "market_indicators"

    id = Column(Integer, primary_key=True, index=True)
    series_id = Column(String(32), nullable=False, index=True)  # FRED series ID
    date = Column(Date, nullable=False, index=True)
    value = Column(Float)
    fetched_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (UniqueConstraint("series_id", "date", name="uq_indicator_series_date"),)
