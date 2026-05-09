#Requires -Version 5.1
<#
.SYNOPSIS
  Relax S3 block-public-access (bucket only) and attach a read-only bucket policy for employer/college logo prefixes.

.DESCRIPTION
  Bucket: campusplacement-docs-prod-ap-south-1
  Public GetObject: employers/* and tenants/* only (NOT students/*).

  Prerequisites: AWS CLI v2, credentials (aws configure or env vars), IAM rights for
  s3:PutBucketPublicAccessBlock, s3:PutBucketPolicy, s3:GetBucketPolicy.

  If this fails with an account-level block, use the AWS Console:
  S3 -> Block Public Access settings for this account.

.NOTES
  Run:  powershell -ExecutionPolicy Bypass -File .\s3-logo-public-read.ps1
  Or:  .\s3-logo-public-read.ps1
#>

$ErrorActionPreference = 'Stop'

$Bucket = 'campusplacement-docs-prod-ap-south-1'
$Region = 'ap-south-1'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PolicyFile = Join-Path $ScriptDir 's3-logo-public-read-policy.json'

Write-Host "Bucket: $Bucket | Region: $Region" -ForegroundColor Cyan

# 1) Bucket-level public access block: allow bucket policies for public read; keep ACL public access blocked
Write-Host "`n[1/3] put-public-access-block ..." -ForegroundColor Yellow
aws s3api put-public-access-block `
  --bucket $Bucket `
  --region $Region `
  --public-access-block-configuration `
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=false,RestrictPublicBuckets=false"

if ($LASTEXITCODE -ne 0) { throw "put-public-access-block failed (exit $LASTEXITCODE)" }

# 2) Write bucket policy JSON next to this script
$policyJson = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadEmployerAndCollegeLogosOnly",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::campusplacement-docs-prod-ap-south-1/employers/*",
        "arn:aws:s3:::campusplacement-docs-prod-ap-south-1/tenants/*"
      ]
    }
  ]
}
"@

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($PolicyFile, $policyJson.Trim(), $utf8NoBom)
Write-Host "`n[2/3] Wrote $PolicyFile" -ForegroundColor Yellow

# 3) Apply policy — avoid file:///C:/... (Errno 22 on Windows); prefer relative file:// from script dir
Write-Host "`n[3/3] put-bucket-policy ..." -ForegroundColor Yellow
Push-Location $ScriptDir
try {
  aws s3api put-bucket-policy `
    --bucket $Bucket `
    --region $Region `
    --policy "file://s3-logo-public-read-policy.json"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Retry with Windows path form file://C:\..." -ForegroundColor DarkYellow
    $winPath = (Resolve-Path '.\s3-logo-public-read-policy.json').Path
    $fileArg = 'file://' + $winPath
    aws s3api put-bucket-policy --bucket $Bucket --region $Region --policy $fileArg
    if ($LASTEXITCODE -ne 0) { throw "put-bucket-policy failed (exit $LASTEXITCODE)" }
  }
} finally {
  Pop-Location
}

Write-Host "`nDone. Verifying policy ..." -ForegroundColor Green
aws s3api get-bucket-policy --bucket $Bucket --region $Region --output text
Write-Host "`nOpen a logo object URL in the browser; it should load without AccessDenied." -ForegroundColor Green
