
$ErrorActionPreference = "Stop"

Write-Host "Starting Parsing Benchmark (PowerShell)..."

# 1. Get Token (filter out dotenv logs)
$output = node backend/tests/api/silent_token.js
$token = $output | Select-Object -Last 1
if (-not $token) { Write-Error "Failed to get token"; exit 1 }

# 2. Upload
$pdfPath = "backend/tests/api/test.pdf"
Write-Host "Uploading $pdfPath..."
$start = Get-Date

$json = curl.exe -s -X POST -H "Authorization: Bearer $token" -F "file=@$pdfPath" http://localhost:5000/v1/cvs/upload

if ($LASTEXITCODE -ne 0) { Write-Error "Upload failed"; exit 1 }

Write-Host "Debug JSON: $json"
$jsonObj = $json | ConvertFrom-Json
$cvId = $jsonObj.data.cv.id
Write-Host "CV ID: $cvId"
Write-Host "Upload Complete. Polling status..."

# 3. Poll
$parsed = $false
while (-not $parsed) {
    if ((Get-Date) - $start -gt (New-TimeSpan -Seconds 180)) {
        Write-Error "Timeout > 180s"
        exit 1
    }

    $statusJson = curl.exe -s -H "Authorization: Bearer $token" http://localhost:5000/v1/cvs/$cvId
    $statusObj = $statusJson | ConvertFrom-Json
    $status = $statusObj.data.parsingStatus
    
    if ($status -eq "COMPLETED") {
        $parsed = $true
    }
    elseif ($status -eq "FAILED") {
        Write-Error "Parsing FAILED: $($statusObj.data.parsingError)"
        exit 1
    }
    else {
        Write-Host -NoNewline "."
        Start-Sleep -Milliseconds 500
    }
}

$duration = ((Get-Date) - $start).TotalSeconds
Write-Host "`nTotal Time: $duration seconds"
if ($duration -lt 10) {
    Write-Host "GOAL MET: Less than 10s" -ForegroundColor Green
}
else {
    Write-Host "GOAL MISSED: More than 10s" -ForegroundColor Yellow
}
