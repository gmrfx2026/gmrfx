#Requires -RunAsAdministrator
<#
  Jalankan di VPS Windows (PowerShell as Administrator):
    powershell -ExecutionPolicy Bypass -File .\scripts\vps-mt5-gmrfx-connectivity.ps1

  Mengecek koneksi HTTPS ke gmrfx.app (WebRequest MT5 = TCP 443 keluar).
  Opsional: buka outbound firewall untuk terminal MT5 jika path diketahui.
#>

$ErrorActionPreference = "Continue"
$HostName = "gmrfx.app"
$Port = 443

Write-Host "=== GMRFX — cek koneksi VPS untuk lisensi MT5 ===" -ForegroundColor Cyan
Write-Host ""

# 1) DNS
try {
  $dns = [System.Net.Dns]::GetHostAddresses($HostName)
  Write-Host "[DNS] OK: $HostName -> $($dns.Address -join ', ')"
} catch {
  Write-Host "[DNS] GAGAL: $_" -ForegroundColor Red
  exit 1
}

# 2) TCP 443
$tnc = Test-NetConnection -ComputerName $HostName -Port $Port -WarningAction SilentlyContinue
if ($tnc.TcpTestSucceeded) {
  Write-Host "[TCP $Port] OK ke $HostName"
} else {
  Write-Host "[TCP $Port] GAGAL — outbound ke HTTPS mungkin diblokir (firewall VPS / security group)." -ForegroundColor Red
  Write-Host "        Di cloud panel: buka OUTBOUND TCP 443 (atau allow all outbound untuk tes)." -ForegroundColor Yellow
}

# 3) HTTPS (mirip layer WebRequest)
try {
  $resp = Invoke-WebRequest -Uri "https://$HostName/" -Method Head -TimeoutSec 15 -UseBasicParsing
  Write-Host "[HTTPS] OK: status $($resp.StatusCode)"
} catch {
  Write-Host "[HTTPS] GAGAL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Di MetaTrader 5 (wajib) ===" -ForegroundColor Cyan
Write-Host "  Tools -> Options -> Expert Advisors"
Write-Host "  Centang: Allow WebRequest for listed URL"
Write-Host "  Tambah URL: https://gmrfx.app"
Write-Host "  OK -> tutup MT5 sepenuhnya -> buka lagi -> pasang ulang indikator"
Write-Host ""

# 4) Opsional: firewall rule untuk terminal64.exe (default MT5)
$mt5 = @(
  "${env:ProgramFiles}\MetaTrader 5\terminal64.exe",
  "${env:ProgramFiles(x86)}\MetaTrader 5\terminal64.exe",
  "$env:APPDATA\MetaQuotes\Terminal\*\terminal64.exe"
)

$found = $false
foreach ($p in $mt5[0..1]) {
  if (Test-Path -LiteralPath $p) {
    $found = $true
    $ruleName = "GMRFX MT5 terminal64 outbound"
    $existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $existing) {
      New-NetFirewallRule -DisplayName $ruleName -Direction Outbound -Program $p -Action Allow | Out-Null
      Write-Host "[Firewall] Aturan dibuat: $ruleName -> $p" -ForegroundColor Green
    } else {
      Write-Host "[Firewall] Aturan sudah ada: $ruleName"
    }
    break
  }
}

if (-not $found) {
  Write-Host "[Firewall] terminal64.exe tidak ditemukan di path standar." -ForegroundColor Yellow
  Write-Host "         Jika MT5 di folder custom, buat manual: Outbound Allow untuk terminal64.exe"
}

Write-Host ""
Write-Host "Selesai." -ForegroundColor Cyan
