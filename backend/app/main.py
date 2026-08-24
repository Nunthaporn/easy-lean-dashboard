from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers.easylean import router as easylean_router

settings = get_settings()

app = FastAPI(
    title="EASY LEAN-Line API",
    version="1.0.0",
)


# =========================================================
# CORS
# =========================================================

origins = [
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://172.16.88.141:5174",
]

# ถ้ามีค่าจาก .env/config อยู่แล้ว ให้รวมเข้ามาด้วย
for origin in settings.cors_origin_list:
    if origin not in origins:
        origins.append(origin)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROUTERS
# =========================================================

app.include_router(easylean_router)


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "name": "EASY LEAN-Line API",
        "docs": "/docs",
        "status": "running",
    }