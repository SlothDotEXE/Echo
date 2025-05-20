"""Expose backend.main so `from backend import main` works in tests."""
from . import main  # noqa: F401
