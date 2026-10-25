param([switch]$Stop)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $root
$statePath = Join-Path $root 'storage\app\local-dev.json'
$logDir = Join-Path $root 'storage\logs'
function Is-Owned($item) {
    if (!$item) { return $false }
    $process = Get-Process -Id $item.id -ErrorAction SilentlyContinue
    return ($process -and $process.StartTime.ToUniversalTime().Ticks.ToString() -eq $item.started)
}
function Stop-Owned($state) {
    foreach ($item in @($state.server, $state.watch)) {
        if (Is-Owned $item) { Stop-Process -Id $item.id -Force }
    }
}
function Free-Port([int]$first) {
    $occupied = @([System.Net.NetworkInformation.IPGlobalProperties]::GetIPGlobalProperties().GetActiveTcpListeners() | ForEach-Object { $_.Port })
    for ($port = $first; $port -lt $first + 100; $port++) {
        if ($occupied -contains $port) { continue }
        $listener = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::Loopback, $port)
        $listener.Server.ExclusiveAddressUse = $true
        try { $listener.Start(); return $port } catch {} finally { $listener.Stop() }
    }
    throw "Nincs szabad port a kovetkezo tartomanyban: $first"
}
function Is-Ready([string]$url) {
    try {
        $response = Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 2
        return ($response.StatusCode -eq 200 -and $response.Content.Contains('id="stops"'))
    } catch { return $false }
}
function Info($state) {
    Write-Host ""
    Write-Host "Uton elerheto: $($state.url)" -ForegroundColor Green
    Write-Host "Laravel:      $($state.serverUrl)"
    Write-Host "Naplok:       $logDir\local-*.log"
    Write-Host "Leallitas:    stop-all.bat"
    Write-Host "A folyamatok a hatterben futnak; ezt az ablakot bezarhatod."
}
$mutex = New-Object System.Threading.Mutex($false, 'Local\UtonLocalDevLauncher')
$locked = $false
$created = $null
try {
    $locked = $mutex.WaitOne(0)
    if (!$locked) { throw 'Egy masik inditas mar folyamatban van.' }
    $previous = $null
    if (Test-Path -LiteralPath $statePath) {
        try { $previous = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json } catch {}
    }
    if ($Stop) {
        if ($previous) { Stop-Owned $previous; Remove-Item -LiteralPath $statePath }
        Write-Host 'Az indito altal kezelt folyamatok leallitva.'
        exit 0
    }
    if ($previous -and (Is-Owned $previous.server) -and (Is-Owned $previous.watch) -and (Is-Ready $previous.url)) {
        Write-Host 'Az alkalmazas mar fut.'; Info $previous; exit 0
    }
    if ($previous) { Stop-Owned $previous }
    $php = (Get-Command php.exe -ErrorAction Stop).Source
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    foreach ($file in @('vendor\autoload.php', 'node_modules\webpack\bin\webpack.js', '.env')) {
        if (!(Test-Path -LiteralPath (Join-Path $root $file))) { throw "Hianyzo fajl: $file. Ellenorizd a projekt fuggosegeit es a .env fajlt." }
    }
    New-Item -ItemType Directory -Force -Path $logDir, (Split-Path $statePath) | Out-Null
    $serverPort = Free-Port 8000
    $syncPort = Free-Port 3000
    $env:FUTAR_SERVER_PORT = "$serverPort"
    $env:FUTAR_SYNC_PORT = "$syncPort"
    $serverUrl = "http://127.0.0.1:$serverPort"
    $url = "http://127.0.0.1:$syncPort"
    Write-Host "Laravel inditasa: $serverUrl"
    $server = Start-Process -FilePath $php -ArgumentList @('-S', "127.0.0.1:$serverPort", '-t', ('"' + (Join-Path $root 'public') + '"'), ('"' + (Join-Path $root 'server.php') + '"')) -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'local-server.log') -RedirectStandardError (Join-Path $logDir 'local-server-error.log')
    $created = @{server=@{id=$server.Id;started=$server.StartTime.ToUniversalTime().Ticks.ToString()};watch=$null;url=$url;serverUrl=$serverUrl}
    Write-Host "Build es BrowserSync inditasa: $url"
    $watch = Start-Process -FilePath $node -ArgumentList @('node_modules/webpack/bin/webpack.js', '--watch', '--config=node_modules/laravel-mix/setup/webpack.config.js') -WorkingDirectory $root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $logDir 'local-watch.log') -RedirectStandardError (Join-Path $logDir 'local-watch-error.log')
    $created.watch = @{id=$watch.Id;started=$watch.StartTime.ToUniversalTime().Ticks.ToString()}
    $created | ConvertTo-Json | Set-Content -LiteralPath $statePath -Encoding UTF8
    $deadline = (Get-Date).AddSeconds(45)
    do {
        if (!(Is-Owned $created.server) -or !(Is-Owned $created.watch)) { throw "Az egyik folyamat leallt. Reszletek: $logDir\local-*-error.log" }
        if (Is-Ready $url) { Info $created; exit 0 }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)
    throw "A szerver 45 masodpercen belul nem lett elerheto. Reszletek: $logDir\local-*.log"
} catch {
    if ($created) { Stop-Owned $created }
    Write-Host "HIBA: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    if ($locked) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
