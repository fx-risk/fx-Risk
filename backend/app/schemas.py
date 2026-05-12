from datetime import date as Date
from pydantic import BaseModel


class ExchangeRateOut(BaseModel):
    date: Date
    currency: str
    base_rate: float
    buy_cash: float | None = None
    sell_cash: float | None = None
    tt_buy: float | None = None
    tt_sell: float | None = None

    model_config = {"from_attributes": True}


class RateHistoryItem(BaseModel):
    date: Date
    rate: float


class MovingAveragesOut(BaseModel):
    date: Date
    rate: float
    ma5: float | None = None
    ma20: float | None = None
    ma60: float | None = None


class MarketIndicatorOut(BaseModel):
    series_id: str
    date: Date
    value: float | None = None


class USMarketSnapshot(BaseModel):
    fed_funds_rate: MarketIndicatorOut | None = None          # DFF
    treasury_10y: MarketIndicatorOut | None = None            # DGS10
    dollar_index: MarketIndicatorOut | None = None            # DTWEXBGS
    wti_oil: MarketIndicatorOut | None = None                 # DCOILWTICO
