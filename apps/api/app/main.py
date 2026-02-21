from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import configure_logging, logger
from app.lib.errors import ApiException
from app.v1.routes.ping import router as ping_router
from app.v1.routes.whoami import router as whoami_router

configure_logging()

app = FastAPI(
    title="Assessment App API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ─────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Exception handlers ────────────────────────────────────────────────────────


@app.exception_handler(ApiException)
async def api_exception_handler(request: Request, exc: ApiException) -> JSONResponse:
    """Serialise ApiException into the standard error contract."""
    body: dict = {"error": {"code": exc.code, "message": exc.message}}
    if exc.details:
        body["error"]["details"] = exc.details
    return JSONResponse(status_code=exc.status_code, content=body)


# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(ping_router, prefix="/v1")
app.include_router(whoami_router, prefix="/v1")


# ── Health (public) ───────────────────────────────────────────────────────────


@app.get("/health", tags=["ops"])
async def health() -> dict[str, str]:
    return {"status": "ok"}


# ── Startup ───────────────────────────────────────────────────────────────────


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("Starting Assessment App API | ENV=%s PORT=%s", settings.ENV, settings.PORT)
