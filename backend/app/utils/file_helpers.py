"""Utility functions for file handling."""

import os
from pathlib import Path


def ensure_directory(path: str | Path) -> Path:
    """Ensure a directory exists, creating it if necessary."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_safe_filename(filename: str) -> str:
    """Sanitize a filename by removing potentially dangerous characters."""
    # Remove path separators and null bytes
    safe = filename.replace("/", "_").replace("\\", "_").replace("\0", "")
    # Remove leading dots (hidden files)
    safe = safe.lstrip(".")
    return safe or "unnamed_file"


def get_file_size_mb(path: str | Path) -> float:
    """Get file size in megabytes."""
    return os.path.getsize(path) / (1024 * 1024)
