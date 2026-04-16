#!/usr/bin/env bash
# Cek koneksi ke gmrfx.app dari VPS Linux (bukan untuk MT5 Windows, hanya jaringan).
# chmod +x scripts/vps-mt5-gmrfx-connectivity.sh && ./scripts/vps-mt5-gmrfx-connectivity.sh

set -e
HOST="gmrfx.app"
echo "=== GMRFX — cek HTTPS dari VPS Linux ke $HOST ==="
if command -v curl >/dev/null 2>&1; then
  curl -sS -o /dev/null -w "[curl] HTTP %{http_code} time %{time_total}s\n" --max-time 15 "https://$HOST/" || echo "[curl] GAGAL"
else
  echo "Instal curl untuk tes."
fi
getent hosts "$HOST" || true
echo "MT5 di Windows: pakai scripts/vps-mt5-gmrfx-connectivity.ps1 (Administrator)."
