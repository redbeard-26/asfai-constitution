param(
  [string]$Region = "us-west-2",
  [string]$TeamSlug = "fenix-development"
)

$ErrorActionPreference = "Stop"
$authPath = Join-Path $env:APPDATA 'com.vercel.cli\Data\auth.json'
if (-not (Test-Path -LiteralPath $authPath)) { throw "Vercel CLI authentication was not found" }
$auth = Get-Content -Raw -LiteralPath $authPath | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($auth.token)" }
$team = (Invoke-RestMethod -Headers $headers -Uri 'https://api.vercel.com/v2/teams').teams |
  Where-Object { $_.slug -eq $TeamSlug } | Select-Object -First 1
if (-not $team) { throw "Vercel team $TeamSlug was not found" }

function Read-ProductionEnvironment([string]$projectName) {
  $project = Invoke-RestMethod -Headers $headers `
    -Uri "https://api.vercel.com/v9/projects/$projectName`?teamId=$($team.id)"
  $list = Invoke-RestMethod -Headers $headers `
    -Uri "https://api.vercel.com/v10/projects/$($project.id)/env?teamId=$($team.id)"
  $map = [ordered]@{}
  foreach ($item in @($list.envs | Where-Object { $_.target -contains 'production' })) {
    $detail = Invoke-RestMethod -Headers $headers `
      -Uri "https://api.vercel.com/v9/projects/$($project.id)/env/$($item.id)?teamId=$($team.id)&decrypt=true"
    $map[$detail.key] = [string]$detail.value
  }
  return $map
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

$constitution = Read-ProductionEnvironment 'asfai-constitution'
$education = Read-ProductionEnvironment 'asfai-education'
Remove-DeploymentValues $constitution
Remove-DeploymentValues $education
Write-Secret 'asfai/constitution' $constitution
Write-Secret 'asfai/education' $education

Write-Output "Imported sanitized ASFAI production environments into Secrets Manager."
