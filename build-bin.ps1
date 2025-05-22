# 2025 Arto Steffan - Crystal Music Librarry Compilation script

# Define paths
$root = "C:\Users\Tamwyn\Documents\Projets Perso\CrasyMusicLibrary"
$pkg_root = Join-Path $root "pkg-dist"
$rootWSL = "/mnt/c/Users/Tamwyn/Documents/Projets Perso/CrasyMusicLibrary"
$appVersion = "2.0.0"


# Create target directories
$targets = @("mac-os", "linux", "windows")
$supportedTargets = @("linux", "windows")

foreach ($target in $targets) {
    $targetPath = Join-Path $pkg_root $target
    New-Item -ItemType Directory -Path (Join-Path $targetPath "dist") -Force | Out-Null
}
Set-Location $root
$startDate = Get-Date

# Build frontend
Write-Host "Building frontend"
Set-Location "$root\CrazyMusicLibrary"
npm run build
$npmBuildDate = Get-Date
$deltaNpm = $npmBuildDate.Subtract($startDate).TotalSeconds

Set-Location $root
# Copy dist folders
Write-Host "Copying dist"
foreach ($target in $targets) {
    $destTarget = Join-Path $pkg_root $target
    $dest = Join-Path $destTarget "dist"
    Copy-Item -Path "$root\backend\dist\*" -Destination $dest -Recurse -Force
}

# Copy .env file
Write-Host "Copying env"
foreach ($target in $targets) {
    $destTarget = Join-Path $pkg_root $target
    $dest = Join-Path $destTarget ".env"
    Copy-Item -Path "$root\backend\.env" -Destination $dest -Force
}

$copyDate = Get-Date
$deltaCopy = $copyDate.Subtract($npmBuildDate).TotalSeconds 
Write-Host "Windows build"

Set-Location "$root\backend"
pkg -t node22-win-x64 . -o ..\pkg-dist\windows\crystal-music-library-windows-x64
$winBuildDate = Get-Date
$deltaWin = $winBuildDate.Subtract($copyDate).TotalSeconds

Write-Host "Linux build"
wsl -d ubuntu bash "$rootWSL/build-wsl.sh"
$linuxBuildDate = Get-Date
$deltaLinux = $linuxBuildDate.Subtract($winBuildDate).TotalSeconds

Write-Host "Compressing"
Set-Location "$root\pkg-dist"
foreach ($target in $supportedTargets) {
    7z a ".\v$appVersion\crystal-music-library-$target.7z" ".\$target\*"
}
$compressBuildDate = Get-Date
$deltaCompress = $compressBuildDate.Subtract($linuxBuildDate).TotalSeconds
$totalDate = $compressBuildDate.Subtract($startDate).TotalSeconds
Set-Location $root

Write-Host "Process durations:"
Write-Host "  - Frontend build $deltaNpm s"
Write-Host "  - Copy files     $deltaCopy s"
Write-Host "  - Win build      $deltaWin s"
Write-Host "  - Linux build    $deltaLinux s"
Write-Host "  - Compression    $deltaCompress s"
Write-Host "= Total            $totalDate s"
Write-Host "Files saved to v$appVersion"
