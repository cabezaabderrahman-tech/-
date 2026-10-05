$skillsDir = Join-Path $HOME ".claude\skills"
$expected = @("docx","pdf","pptx","xlsx","frontend-design","web-artifacts-builder","webapp-testing","skill-creator","literature-review")
Write-Host "Claude Skills 目录：$skillsDir"
foreach ($name in $expected) {
  $p = Join-Path $skillsDir $name
  if (Test-Path (Join-Path $p "SKILL.md")) {
    Write-Host "[OK] $name" -ForegroundColor Green
  } else {
    Write-Host "[缺失] $name" -ForegroundColor Red
  }
}
Write-Host "research 和 last30days 属于 Claude Code plugin，请在 Claude Code 内用 /plugin 检查。"
