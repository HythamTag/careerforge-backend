# Test script to upload CV and check error logs
$ErrorActionPreference = "Stop"

$cvFile = "Hytham Tag CV.pdf"
$cvPath = Join-Path ".." $cvFile

if (-not (Test-Path $cvPath)) {
    Write-Host "CV file not found at: $cvPath"
    exit 1
}

Write-Host "Uploading CV: $cvPath"
$response = curl.exe -X POST http://localhost:3000/api/cv/upload `
    -F "cv=@$cvPath" `
    -H "Content-Type: multipart/form-data" 2>&1

Write-Host "Response: $response"

# Wait a bit for processing
Start-Sleep -Seconds 5

# Check latest logs
Write-Host "`n=== Latest Worker Logs ==="
$logFiles = Get-ChildItem "logs" -Recurse -Filter "worker*.log" | Sort-Object LastWriteTime -Descending
if ($logFiles) {
    Get-Content $logFiles[0].FullName -Tail 100
}

Write-Host "`n=== Latest Error Logs ==="
$errorLogFiles = Get-ChildItem "logs" -Recurse -Filter "*error*.log" | Sort-Object LastWriteTime -Descending
if ($errorLogFiles) {
    Get-Content $errorLogFiles[0].FullName -Tail 100
}

