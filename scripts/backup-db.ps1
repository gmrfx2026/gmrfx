# Cadangkan database PostgreSQL ke file .sql (butuh pg_dump di PATH).
# Contoh: .\scripts\backup-db.ps1
# Atau: $env:DATABASE_URL = "postgresql://..."; .\scripts\backup-db.ps1

$ErrorActionPreference = "Stop"
if (-not $env:DATABASE_URL) {
  Write-Error "DATABASE_URL tidak di-set. Muat dari .env atau set manual."
}

$outDir = Join-Path $PSScriptRoot ".." "backups"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outFile = Join-Path $outDir "gmrfx-$stamp.sql"

Write-Host "Menulis ke $outFile"
& pg_dump $env:DATABASE_URL --no-owner --no-acl -f $outFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Selesai."
