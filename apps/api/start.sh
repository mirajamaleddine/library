#!/usr/bin/env bash
set -e

python debug_import.py
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --log-level debug