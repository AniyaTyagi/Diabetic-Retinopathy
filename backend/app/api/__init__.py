from fastapi import APIRouter

from app.api import (
    analytics,
    auth,
    centers,
    devices,
    health,
    notifications,
    operations,
    patients,
    reports,
    screenings,
    settings,
    simulation,
    users,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(screenings.router)
api_router.include_router(reports.router)
api_router.include_router(analytics.router)
api_router.include_router(simulation.router)
api_router.include_router(operations.router)
api_router.include_router(settings.router)
api_router.include_router(users.router)
api_router.include_router(centers.router)
api_router.include_router(devices.router)
api_router.include_router(notifications.router)
