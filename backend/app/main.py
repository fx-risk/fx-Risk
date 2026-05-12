import truststore
truststore.inject_into_ssl()  # Windows 시스템 인증서 신뢰 (회사 프록시/SSL 인터셉트 대응)

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import Base, engine
from .routers import market, rates
from . import scheduler


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    scheduler.start()
    yield
    scheduler.stop()


app = FastAPI(
    title="fx-Risk API",
    description="USD/KRW 선물환 매입 추천 시스템 백엔드",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rates.router)
app.include_router(market.router)


@app.get("/")
def root():
    return {
        "service": "fx-Risk API",
        "endpoints": {
            "latest_rate": "/api/rates/latest",
            "rate_history": "/api/rates/history?days=90",
            "us_market": "/api/market/us",
            "docs": "/docs",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok"}
