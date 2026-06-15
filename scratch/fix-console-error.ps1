$srcDir = 'c:\Users\amits\OneDrive\ドキュメント\Desktop\bounce-back-academy\src'
$files = Get-ChildItem -Path $srcDir -Recurse -Include '*.ts','*.tsx' | Where-Object { $_.FullName -notmatch 'node_modules' }

$count = 0
foreach ($f in $files) {
    $content = Get-Content $f.FullName -Raw
    if ($null -eq $content) { continue }
    if ($content -notmatch 'console\.error') { continue }

    # Replace console.error( with logger.error(
    $newContent = $content -replace 'console\.error\(', 'logger.error('

    # Add logger import if not already present and file has imports
    if ($newContent -notmatch "from '@/lib/logger'") {
        if ($newContent -match "^import ") {
            # Insert after the last import block
            $newContent = [regex]::Replace($newContent, '((?:^import [^\n]+\n)+)', '$1import { logger } from ' + "'@/lib/logger'" + "`n", [System.Text.RegularExpressions.RegexOptions]::Multiline)
        } else {
            $newContent = "import { logger } from '@/lib/logger'`n" + $newContent
        }
    }

    Set-Content $f.FullName $newContent -NoNewline -Encoding UTF8
    $count++
    Write-Host "Fixed: $($f.Name)"
}
Write-Host "Done. Fixed $count files."
