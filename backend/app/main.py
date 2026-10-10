from contextlib import asynccontextmanager
import logging
import threading

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.schema_sync import ensure_schema
from app.services.defaults import ensure_platform_defaults

logger = logging.getLogger("netrax")


def _warmup_ml() -> None:
    """Load CNN (+ QML stack) in background so first analyze is faster."""
    try:
        from app.ml import cnn as cnn_mod
        from app.ml import qml as qml_mod

        if cnn_mod.cnn_enabled():
            logger.info("Warming up CNN weights…")
            cnn_mod._load()  # noqa: SLF001
            logger.info("CNN ready")
        if qml_mod.qml_enabled():
            logger.info("Warming up QML artifacts…")
            qml_mod._load()  # noqa: SLF001
            logger.info("QML ready")
    except Exception as exc:  # noqa: BLE001
        logger.warning("ML warmup skipped: %s", exc)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_schema()
    db = SessionLocal()
    try:
        ensure_platform_defaults(db)
    finally:
        db.close()
    threading.Thread(target=_warmup_ml, name="ml-warmup", daemon=True).start()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.2.0",
        description="NetraX API — live CNN (DINOv2) + Hybrid QML ensemble with Grad-CAM.",
        lifespan=lifespan,
    )
    origins = settings.cors_origin_list
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins if origins else ["*"],
        allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router)
    return app


app = create_app()
