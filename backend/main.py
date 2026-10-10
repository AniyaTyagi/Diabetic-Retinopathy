"""Entrypoint wrapper for Uvicorn when executed from root or backend directory."""
from app.main import app

__all__ = ["app"]
