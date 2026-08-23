param(
  [string]$Region = "us-west-2",
  [string]$TeamSlug = "fenix-development",
  [string]$EducationRepoPath = "",
  [string]$ConstitutionEnvironmentPath = "",
  [string]$EducationEnvironmentPath = ""
)

$ErrorActionPreference = "Stop"
$constitutionRepo = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
if (-not $EducationRepoPath) {
  $EducationRepoPath = Join-Path (Split-Path $constitutionRepo -Parent) "asfai-education"
}
$educationRepo = (Resolve-Path $EducationRepoPath).Path
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  throw "The authenticated Vercel CLI is required to export sensitive production values"
}

function Read-DotEnv([string]$path) {
  $map = [ordered]@{}
  foreach ($line in Get-Content -LiteralPath $path) {
    if ($line -notmatch '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { continue }
    $key = $matches[1]
    $raw = $matches[2]
    $value = if ($raw.StartsWith('"') -and $raw.EndsWith('"')) {
      $raw | ConvertFrom-Json
    } else {
      $raw
    }
    if (-not [string]::IsNullOrEmpty([string]$value)) {
      $map[$key] = [string]$value
    }
  }
  return $map
}

function Read-ProductionEnvironment([string]$repo, [string]$projectName, [string]$providedPath) {
  if ($providedPath) {
    return Read-DotEnv (Resolve-Path -LiteralPath $providedPath).Path
  }
  $linkPath = Join-Path $repo ".vercel/project.json"
  if (-not (Test-Path -LiteralPath $linkPath)) {
    vercel link --yes --project $projectName --scope $TeamSlug --cwd $repo | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Could not link $projectName for environment export" }
  }

  $temporary = Join-Path $repo ".vercel/asfai-aws-$([Guid]::NewGuid().ToString('N')).env"
  try {
    vercel env pull $temporary --yes --environment production --scope $TeamSlug --cwd $repo | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Could not export the $projectName production environment" }
    return Read-DotEnv $temporary
  }
  finally {
    Remove-Item -LiteralPath $temporary -Force -ErrorAction SilentlyContinue
  }
}

function Remove-DeploymentValues([Collections.IDictionary]$map) {
  @(
    'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN',
    'VERCEL_ACCESS_TOKEN', 'VERCEL_URL', 'VERCEL_ENV', 'VERCEL',
    'AUTH_URL', 'AUTH_TRUST_HOST', 'EDUCATION_ORIGIN'
  ) | ForEach-Object { $map.Remove($_) }
}

function Write-Secret([string]$secretId, [Collections.IDictionary]$values) {
  $temporary = New-TemporaryFile
  try {
    $values | ConvertTo-Json -Depth 5 -Compress | Set-Content -LiteralPath $temporary -NoNewline
    aws secretsmanager put-secret-value --region $Region --secret-id $secretId `
      --secret-string "file://$temporary" --output json | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Secrets Manager rejected $secretId" }
  }
  finally { Remove-Item -LiteralPath $temporary -Force -ErrorAction SilentlyContinue }
}

$constitution = Read-ProductionEnvironment $constitutionRepo 'asfai-constitution' $ConstitutionEnvironmentPath
$education = Read-ProductionEnvironment $educationRepo 'asfai-education' $EducationEnvironmentPath
Remove-DeploymentValues $constitution
Remove-DeploymentValues $education
if (-not $constitution.Contains('DATABASE_URL') -or -not $constitution.Contains('AUTH_SECRET')) {
  throw "Vercel did not export its non-readable sensitive values. Supply -ConstitutionEnvironmentPath with a trusted dotenv file containing at least DATABASE_URL and AUTH_SECRET."
}
Write-Secret 'asfai/constitution' $constitution
Write-Secret 'asfai/education' $education

Write-Output "Imported sanitized ASFAI production environments into Secrets Manager."
