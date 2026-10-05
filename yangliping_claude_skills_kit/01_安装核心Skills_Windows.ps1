$ErrorActionPreference = "Stop"

Write-Host "=== 杨黎平 Claude Skills 安装器 ===" -ForegroundColor Cyan

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "未检测到 git。请先安装 Git for Windows：https://git-scm.com/" -ForegroundColor Red
    exit 1
}

$skillsDir = Join-Path $HOME ".claude\skills"
New-Item -ItemType Directory -Force -Path $skillsDir | Out-Null
$tempDir = Join-Path $env:TEMP ("claude-skills-" + [guid]::NewGuid().ToString())
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

function Copy-Skill($source, $name) {
    $target = Join-Path $skillsDir $name
    if (Test-Path $target) { Remove-Item -Recurse -Force $target }
    Copy-Item -Recurse -Force $source $target
    Write-Host "[OK] $name" -ForegroundColor Green
}

# git 是外部程序，失败时 PowerShell 不会自动停止，必须检查 $LASTEXITCODE。
function Invoke-GitClone($url, $dest) {
    git clone --depth 1 $url $dest
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[失败] git clone 出错（退出码 $LASTEXITCODE）：$url" -ForegroundColor Red
        Write-Host "请检查网络或代理能否访问 GitHub，然后重新运行本脚本。安装已中止。" -ForegroundColor Red
        throw "git clone 失败：$url"
    }
}

try {
    Write-Host "下载 Anthropic 官方 Skills..."
    Invoke-GitClone "https://github.com/anthropics/skills.git" (Join-Path $tempDir "anthropics-skills")
    $official = Join-Path $tempDir "anthropics-skills\skills"
    @("docx","pdf","pptx","xlsx","frontend-design","web-artifacts-builder","webapp-testing","skill-creator") | ForEach-Object {
        Copy-Skill (Join-Path $official $_) $_
    }

    Write-Host "下载 literature-review..."
    Invoke-GitClone "https://github.com/pinshuai/literature-review-skill.git" (Join-Path $tempDir "literature-review")
    $litTarget = Join-Path $skillsDir "literature-review"
    if (Test-Path $litTarget) { Remove-Item -Recurse -Force $litTarget }
    New-Item -ItemType Directory -Force -Path $litTarget | Out-Null
    foreach ($item in @("SKILL.md","assets","references","scripts")) {
        $src = Join-Path (Join-Path $tempDir "literature-review") $item
        if (Test-Path $src) { Copy-Item -Recurse -Force $src $litTarget }
    }
    Write-Host "[OK] literature-review" -ForegroundColor Green

    Write-Host ""
    Write-Host "核心 Skills 安装完成：$skillsDir" -ForegroundColor Cyan
    Write-Host "下一步：打开 Claude Code，执行 03_在Claude_Code里粘贴这些命令.txt 中的命令。" -ForegroundColor Yellow
}
finally {
    if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
}
