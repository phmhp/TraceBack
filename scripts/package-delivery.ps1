$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$deliveryRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$deliveryVersion = (Get-Content -LiteralPath (Join-Path $deliveryRoot 'package.json') -Raw | ConvertFrom-Json).version
$deliveryOut = Join-Path $deliveryRoot "delivery/v$deliveryVersion"
$deliveryExe = Join-Path $deliveryRoot "release/Vehicle-Logic-Lab-v$deliveryVersion.exe"
if (-not (Test-Path -LiteralPath $deliveryExe -PathType Leaf)) { throw "Build the current Windows EXE first: $deliveryExe" }
New-Item -ItemType Directory -Path $deliveryOut -Force | Out-Null
$sourceZip = Join-Path $deliveryOut "Vehicle-Logic-Lab-v$deliveryVersion-Source.zip"
$playerZip = Join-Path $deliveryOut "Vehicle-Logic-Lab-v$deliveryVersion-Windows.zip"
foreach ($target in @($sourceZip, $playerZip)) { if (Test-Path -LiteralPath $target) { throw "Already exists; preserve the previous delivery: $target" } }
# Allowlist project sources; never include node_modules, releases, build output, or delivery itself.
$sourceFiles = [System.Collections.Generic.List[System.IO.FileInfo]]::new()
foreach ($folder in @('src','public','simulation','desktop','scripts','tests','docs')) {
    Get-ChildItem -LiteralPath (Join-Path $deliveryRoot $folder) -File -Recurse -Force | Where-Object {
        $_.FullName.Substring($deliveryRoot.Length + 1) -notmatch '(^|[\/])(node_modules|dist|release|delivery|\.git|\.vite)([\/]|$)' -and
        $_.Name -notmatch '\.(log|tsbuildinfo)$'
    } | ForEach-Object { $sourceFiles.Add($_) }
}
Get-ChildItem -LiteralPath $deliveryRoot -File -Force | Where-Object {
    $_.Name -in @('package.json','package-lock.json','index.html','tsconfig.json','vite.config.ts','README.md','HANDOFF.md','AGENTS.md','.gitignore')
} | ForEach-Object { $sourceFiles.Add($_) }
function New-VerifiedZip([string]$Target, [System.IO.FileInfo[]]$Files, [bool]$Source) {
    $stream = [System.IO.File]::Open($Target, [System.IO.FileMode]::CreateNew)
    try {
        $archive = [System.IO.Compression.ZipArchive]::new($stream, [System.IO.Compression.ZipArchiveMode]::Create, $true)
        try {
            foreach ($file in $Files) {
                $relative = if ($Source) { 'vehicle-logic-lab/' + $file.FullName.Substring($deliveryRoot.Length + 1).Replace('\','/') } else { $file.Name }
                [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $relative, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
            }
        } finally { $archive.Dispose() }
    } finally { $stream.Dispose() }
    # Read every decompressed entry and compare its SHA-256 to the original. No extraction/deletion needed.
    $check = [System.IO.Compression.ZipFile]::OpenRead($Target)
    try {
        if ($check.Entries.Count -ne $Files.Count) { throw 'Archive file count mismatch' }
        foreach ($entry in $check.Entries) {
            $original = if ($Source) { Join-Path $deliveryRoot $entry.FullName.Substring('vehicle-logic-lab/'.Length) } else { $deliveryExe }
            $entryStream = $entry.Open()
            $hasher = [System.Security.Cryptography.SHA256]::Create()
            try { $actual = [BitConverter]::ToString($hasher.ComputeHash($entryStream)).Replace('-','') }
            finally { $entryStream.Dispose(); $hasher.Dispose() }
            if ($actual -ne (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash) { throw "Archive hash mismatch: $($entry.FullName)" }
        }
    } finally { $check.Dispose() }
    $item = Get-Item -LiteralPath $Target
    [PSCustomObject]@{Path=$item.FullName;Bytes=$item.Length;MiB=[math]::Round($item.Length/1MB,2);Files=$Files.Count;SHA256=(Get-FileHash -LiteralPath $Target -Algorithm SHA256).Hash;Verification='Every entry SHA-256 matches source'} | ConvertTo-Json -Compress
}
New-VerifiedZip $sourceZip ($sourceFiles.ToArray()) $true
New-VerifiedZip $playerZip @((Get-Item -LiteralPath $deliveryExe)) $false
