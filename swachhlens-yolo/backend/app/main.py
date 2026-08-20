from fastapi import FastAPI
from app.routes.reports import router as reports_router

app = FastAPI(title="SwachhLens Backend")


@app.get("/api/v1/health")
def health():
    return {
        "status": "ok",
        "database": "mongodb"
    }


app.include_router(reports_router, prefix="/api/v1")