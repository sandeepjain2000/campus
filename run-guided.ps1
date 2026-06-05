# Launch guided manual test runner from parent folder.
# PLAYBOOK (automated typing/clicks — recommended):
#   .\run-guided.ps1 --playbook internships-employer-publish
# Legacy section mode:
#   .\run-guided.ps1 --section internships.employer

$ProjectRoot = Join-Path $PSScriptRoot "campus-placement"
$Runner = Join-Path $ProjectRoot "qa\guided\run-guided.mjs"

if (-not (Test-Path $Runner)) {
    Write-Error "Runner not found at $Runner. Use campus-placement folder or check install."
    exit 1
}

Set-Location $ProjectRoot
node $Runner @args
