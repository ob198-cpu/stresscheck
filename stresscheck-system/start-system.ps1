$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Url = "http://127.0.0.1:8787"
$LogPath = Join-Path $Root "server.log"

Set-Location $Root

function Write-Step($Message) {
  Write-Host ""
  Write-Host "== $Message" -ForegroundColor Cyan
}

function Test-Server {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 2
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Find-Node {
  $command = Get-Command node -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $candidates = @(
    "C:\Users\obata\AppData\Local\OpenAI\Codex\bin\node.exe",
    "D:\node.exe",
    "C:\Program Files\nodejs\node.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  return $null
}

Write-Host "Stress check system launcher" -ForegroundColor Green
Write-Host "Keep this window open while using the system."

if (Test-Server) {
Write-Step "Already running"
  Write-Host $Url
  Start-Process $Url
  exit 0
}

$node = Find-Node
if (-not $node) {
  Write-Host ""
  Write-Host "Node.js was not found." -ForegroundColor Red
  Write-Host "Install Node.js or start the system from Codex."
  Write-Host "Do not close this window until you have checked this message."
  exit 1
}

Write-Step "Node.js found"
Write-Host $node

Write-Step "Starting server"
Write-Host "Log: $LogPath"

$env:HOST = "127.0.0.1"
$env:PORT = "8787"

$server = Start-Process `
  -FilePath $node `
  -ArgumentList "server.js" `
  -WorkingDirectory $Root `
  -RedirectStandardOutput $LogPath `
  -RedirectStandardError (Join-Path $Root "server-error.log") `
  -PassThru `
  -WindowStyle Hidden

$started = $false
for ($i = 0; $i -lt 20; $i++) {
  Start-Sleep -Milliseconds 500
  if ($server.HasExited) {
    break
  }
  if (Test-Server) {
    $started = $true
    break
  }
}

if (-not $started) {
  Write-Host ""
  Write-Host "Could not start the server." -ForegroundColor Red
  Write-Host "Check log: $LogPath"
  if (Test-Path -LiteralPath $LogPath) {
    Write-Host ""
    Get-Content -LiteralPath $LogPath -Tail 30
  }
  exit 1
}

Write-Step "Started"
Write-Host $Url
Start-Process $Url

Write-Host ""
Write-Host "To stop the system, close this window."
Write-Host "You can also press Ctrl + C."

try {
  Wait-Process -Id $server.Id
} finally {
  if (-not $server.HasExited) {
    Stop-Process -Id $server.Id -Force
  }
}
