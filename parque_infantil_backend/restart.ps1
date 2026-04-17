$port = 8000
$tcp = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($tcp) {
    if ($tcp.OwningProcess) {
        $proc = Get-Process -Id $tcp.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Stop-Process -Id $proc.Id -Force
            Write-Host "Killed process $($proc.Name) on port $port"
        }
    }
} else {
    Write-Host "No process found on port $port"
}
