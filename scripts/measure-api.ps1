# Quick API latency check (requires backend on :8000)
param(
    [string]$BaseUrl = "http://localhost:8000/api/v1"
)

function Measure-Endpoint($Name, $Uri) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $null = Invoke-RestMethod -Uri $Uri -Method Get
        $sw.Stop()
        [PSCustomObject]@{ Endpoint = $Name; Ms = $sw.ElapsedMilliseconds; Ok = $true }
    } catch {
        $sw.Stop()
        [PSCustomObject]@{ Endpoint = $Name; Ms = $sw.ElapsedMilliseconds; Ok = $false; Error = $_.Exception.Message }
    }
}

Write-Host "DLM API latency probe -> $BaseUrl"
Measure-Endpoint "GET /laundries (1st)" "$BaseUrl/laundries"
Measure-Endpoint "GET /laundries (2nd cached)" "$BaseUrl/laundries"
Measure-Endpoint "GET /laundries?limit=20" "$BaseUrl/laundries?limit=20"
