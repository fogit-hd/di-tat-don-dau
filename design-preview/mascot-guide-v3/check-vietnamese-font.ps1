# Audit actual font glyph coverage; no font files are copied or redistributed.
Add-Type -AssemblyName PresentationCore
$points=@(258,259,272,273,296,297,360,361,416,417,431,432)+@(7840..7929)
$result=foreach($fontFile in @('georgia.ttf','georgiab.ttf','times.ttf','timesbd.ttf')) {
 $face=[Windows.Media.GlyphTypeface]::new([Uri]('C:/Windows/Fonts/'+$fontFile))
 $absent=@($points | Where-Object { -not $face.CharacterToGlyphMap.ContainsKey([int]$_) })
 [PSCustomObject]@{file=$fontFile;tested=$points.Count;missing=$absent.Count;characters=($absent | ForEach-Object {[char]$_}) -join ''}
}
$destination=Join-Path $PSScriptRoot 'verification-actions/font-coverage.json'
[IO.File]::WriteAllText($destination,($result|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
$result | Select-Object file,tested,missing
if(@($result | Where-Object {$_.file -like 'times*' -and $_.missing -gt 0}).Count) {throw 'Incomplete Vietnamese font'}
