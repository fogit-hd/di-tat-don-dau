# Public pages only: keep gameplay/session lettering unchanged.
# Generate from the same bundled Vietnamese-complete font used by native public fields.
$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path $PSScriptRoot -Parent
$fontPath = Join-Path $sourceRoot 'frontend/public/assets/fonts/public-ui/DejaVuSans.ttf'
Add-Type -AssemblyName PresentationCore
$coverage = [Windows.Media.GlyphTypeface]::new([Uri]$fontPath)
$required = @(258,259,272,273,296,297,360,361,416,417,431,432) + @(7840..7929)
$missing = @($required | Where-Object { -not $coverage.CharacterToGlyphMap.ContainsKey($_) })
if ($missing.Count) { throw "Bundled font is missing Vietnamese glyphs: $missing" }
Add-Type -AssemblyName System.Drawing
$collection = [System.Drawing.Text.PrivateFontCollection]::new()
$collection.AddFontFile($fontPath)
$fontFamily = $collection.Families[0]
$bitmap = [System.Drawing.Bitmap]::new(1,1)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$format = [System.Drawing.StringFormat]::GenericTypographic.Clone()
$format.FormatFlags = $format.FormatFlags -bor [System.Drawing.StringFormatFlags]::MeasureTrailingSpaces
$codes = @(32..126) + @(160..255) + @(258,259,272,273,296,297,360,361,416,417,431,432) + @(7840..7929) + @(8211,8212,8216,8217,8220,8221,8226,8230,8249,8250,8594,8592,215,8722,8363)
$fonts = @{}
foreach ($weight in @('regular','bold')) {
  $style = if($weight -eq 'bold'){[System.Drawing.FontStyle]::Bold}else{[System.Drawing.FontStyle]::Regular}
  $font = [System.Drawing.Font]::new($fontFamily,64,$style,[System.Drawing.GraphicsUnit]::Pixel)
  # PowerShell hashtables are case-insensitive: using one loses a/A, o/O, etc.
  $glyphs = [System.Collections.Generic.Dictionary[string,object]]::new([StringComparer]::Ordinal)
  foreach($code in $codes) {
    $letter = [char]$code
    $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
    $path.AddString([string]$letter,$fontFamily,[int]$style,64,[System.Drawing.PointF]::new(0,0),$format)
    $width = $graphics.MeasureString([string]$letter,$font,1000,$format).Width
    $d = [System.Text.StringBuilder]::new()
    if($path.PointCount -gt 0) {
      $points=$path.PathPoints; $types=$path.PathTypes
      for($i=0;$i -lt $points.Length;$i++) {
        $type = $types[$i] -band 7
        $x=$points[$i].X.ToString('0.##',[Globalization.CultureInfo]::InvariantCulture)
        $y=$points[$i].Y.ToString('0.##',[Globalization.CultureInfo]::InvariantCulture)
        if($type -eq 0){[void]$d.Append("M$x $y")}
        elseif($type -eq 1){[void]$d.Append("L$x $y")}
        elseif($type -eq 3){
          $parts=@()
          for($j=0;$j -lt 3;$j++){$parts+=$points[$i+$j].X.ToString('0.##',[Globalization.CultureInfo]::InvariantCulture);$parts+=$points[$i+$j].Y.ToString('0.##',[Globalization.CultureInfo]::InvariantCulture)}
          [void]$d.Append('C'+($parts -join ' '));$i+=2
        }
        if(($types[$i] -band 128) -ne 0){[void]$d.Append('Z')}
      }
    }
    $glyphs[[string]$letter]=@([Math]::Round($width,2),$d.ToString())
    $path.Dispose()
  }
  $fonts[$weight]=$glyphs;$font.Dispose()
}
$sourceRoot=if($PSScriptRoot){Split-Path $PSScriptRoot -Parent}else{(Get-Location).Path}
$destination=Join-Path $sourceRoot 'frontend/src/lib/public-letter-paths.json'
[IO.File]::WriteAllText($destination,($fonts|ConvertTo-Json -Depth 5 -Compress),[Text.UTF8Encoding]::new($false))
$graphics.Dispose();$bitmap.Dispose();$fontFamily.Dispose();$format.Dispose();$collection.Dispose()
Write-Output "Exported letter paths: $((Get-Item $destination).Length) bytes"
