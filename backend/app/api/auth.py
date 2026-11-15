import time
from collections import defaultdict
from threading import Lock

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.roles import DEFAULT_REGISTER_ROLE
from app.services.auth import authenticate_user, create_access_token, hash_password

router = APIRouter(prefix="/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Simple in-memory rate limiter for login endpoints
# ---------------------------------------------------------------------------
_LOGIN_WINDOW_S = 60   # 1 minute window
_LOGIN_MAX = 10        # max attempts per IP per window
_rate_data: dict[str, list[float]] = defaultdict(list)
_rate_lock = Lock()


def _check_login_rate(request: Request) -> None:
    """Raise 429 if the caller IP has exceeded _LOGIN_MAX attempts in the last window."""
    client_ip = (request.client.host if request.client else "unknown")
    now = time.monotonic()
    with _rate_lock:
        timestamps = _rate_data[client_ip]
        # Prune old entries outside the window
        cutoff = now - _LOGIN_WINDOW_S
        timestamps[:] = [t for t in timestamps if t > cutoff]
        if len(timestamps) >= _LOGIN_MAX:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Too many login attempts. Try again in {_LOGIN_WINDOW_S} seconds.",
            )
        timestamps.append(now)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    user = User(
        email=body.email.lower(),
        full_name=body.full_name.strip(),
        role=DEFAULT_REGISTER_ROLE,  # assigned by system; not chosen on login/signup
        center=body.center,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.email, {"role": user.role, "name": user.full_name})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login_json(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    _check_login_rate(request)
    user = authenticate_user(db, body.email.lower(), body.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.email, {"role": user.role, "name": user.full_name})
    return TokenResponse(access_token=token)


@router.post("/token", response_model=TokenResponse)
def login_form(request: Request, form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """OAuth2 form login for Swagger Authorize button (username = email)."""
    _check_login_rate(request)
    user = authenticate_user(db, form.username.lower(), form.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.email, {"role": user.role, "name": user.full_name})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
