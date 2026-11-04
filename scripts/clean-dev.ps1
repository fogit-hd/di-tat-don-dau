param([switch]$Preview)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
if (!(Test-Path -LiteralPath (Join-Path $projectRoot 'package.json')) -or !(Test-Path -LiteralPath (Join-Path $projectRoot 'frontend')) -or !(Test-Path -LiteralPath (Join-Path $projectRoot 'backend'))) {
  throw 'Refusing to clean: project markers are missing.'
}
$protected = @('.git','node_modules','assets','prisma','backups','dist','.agents','.codex','uploads','data','saves','reports')
$targets = [Collections.Generic.List[string]]::new()
function Find-DevelopmentFiles([string]$directory) {
  foreach ($entry in Get-ChildItem -LiteralPath $directory -Force) {
    if ($entry.Attributes -band [IO.FileAttributes]::ReparsePoint) { continue }
    if ($entry.PSIsContainer) {
      if ($entry.Name -notin $protected) { Find-DevelopmentFiles $entry.FullName }
    } elseif ($entry.Name.StartsWith('.tmp') -or $entry.Extension -in @('.tmp','.log')) {
      $resolved = [IO.Path]::GetFullPath($entry.FullName)
      if (!$resolved.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Target escaped the project.' }
      $targets.Add($resolved)
    }
  }
}
Find-DevelopmentFiles $projectRoot
foreach ($target in $targets) {
  if ($Preview) { Write-Output ('Would remove: ' + $target.Substring($projectRoot.Length + 1)) }
  else { Remove-Item -LiteralPath $target -Force; Write-Output ('Removed: ' + $target.Substring($projectRoot.Length + 1)) }
}
Write-Output ('Development files: ' + $targets.Count + $(if ($Preview) {' (preview only)'} else {''}))
