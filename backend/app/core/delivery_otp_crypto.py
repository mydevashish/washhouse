"""Encrypt delivery OTP for customer re-fetch (hashed copy used for verification)."""

from __future__ import annotations

import base64
import hashlib

from cryptography.fernet import Fernet

from app.core.config import settings


def _fernet() -> Fernet:
    digest = hashlib.sha256(settings.JWT_SECRET.encode("utf-8")).digest()
    key = base64.urlsafe_b64encode(digest)
    return Fernet(key)


def encrypt_otp(code: str) -> str:
    return _fernet().encrypt(code.encode("utf-8")).decode("utf-8")


def decrypt_otp(token: str) -> str:
    return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
