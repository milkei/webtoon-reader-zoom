# Build distributable archives without external dependencies.
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$out = Join-Path $root 'dist'
New-Item -ItemType Directory -Path $out -Force | Out-Null
foreach ($browser in @('chromium','firefox')) {
    $source = Join-Path $root "extension/$browser"
    $destination = Join-Path $out "webtoon-reader-$browser-v0.5.0.zip"
    if (Test-Path $destination) { Remove-Item $destination -Force }
    Compress-Archive -Path (Join-Path $source '*') -DestinationPath $destination
    Write-Output "Created: $destination"
}
