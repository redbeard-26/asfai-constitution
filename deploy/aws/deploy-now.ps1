param(
  [string]$EducationRepoPath = "",
  [string]$Region = "us-west-2",
  [string]$StackName = "asfai-production"
)

$ErrorActionPreference = "Stop"
$constitutionRepo = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
if (-not $EducationRepoPath) {
  $EducationRepoPath = Join-Path (Split-Path $constitutionRepo -Parent) "asfai-education"
}
$educationRepo = (Resolve-Path $EducationRepoPath).Path

foreach ($repo in @($constitutionRepo, $educationRepo)) {
  $dirty = git -C $repo status --porcelain
  if ($LASTEXITCODE -ne 0) { throw "$repo is not a Git repository" }
  if ($dirty) { throw "Commit or stash changes before deploying $repo" }
}

function Output([string]$name) {
  $value = aws cloudformation describe-stacks --region $Region --stack-name $StackName `
    --query "Stacks[0].Outputs[?OutputKey=='$name'].OutputValue" --output text
  if ($LASTEXITCODE -ne 0 -or -not $value) { throw "Could not read stack output $name" }
  return $value.Trim()
}

$bucket = Output "DeploymentBucket"
$project = Output "CodeBuildProject"
$instanceId = Output "InstanceId"
$constitutionCommit = (git -C $constitutionRepo rev-parse HEAD).Trim()
$educationCommit = (git -C $educationRepo rev-parse HEAD).Trim()
$releaseId = "$($constitutionCommit.Substring(0, 12))-$($educationCommit.Substring(0, 12))"
$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
$staging = Join-Path $tempRoot "asfai-aws-$([Guid]::NewGuid().ToString('N'))"
$resolvedStaging = [IO.Path]::GetFullPath($staging)
if (-not $resolvedStaging.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Temporary staging path escaped the system temporary directory"
}

try {
  New-Item -ItemType Directory -Path $resolvedStaging | Out-Null
  $constitutionArchive = Join-Path $resolvedStaging "constitution.zip"
  $educationArchive = Join-Path $resolvedStaging "education.zip"
  git -C $constitutionRepo archive --format=zip --output=$constitutionArchive HEAD
  if ($LASTEXITCODE -ne 0) { throw "Could not archive asfai-constitution" }
  git -C $educationRepo archive --format=zip --output=$educationArchive HEAD
  if ($LASTEXITCODE -ne 0) { throw "Could not archive asfai-education" }

  $source = Join-Path $resolvedStaging "source"
  New-Item -ItemType Directory -Path (Join-Path $source "constitution") -Force | Out-Null
  New-Item -ItemType Directory -Path (Join-Path $source "education") -Force | Out-Null
  Expand-Archive -LiteralPath $constitutionArchive -DestinationPath (Join-Path $source "constitution")
  Expand-Archive -LiteralPath $educationArchive -DestinationPath (Join-Path $source "education")
  $releaseArchive = Join-Path $resolvedStaging "asfai.zip"
  Compress-Archive -Path (Join-Path $source "*") -DestinationPath $releaseArchive -CompressionLevel Optimal
  aws s3 cp $releaseArchive "s3://$bucket/source/asfai.zip" --region $Region --only-show-errors
  if ($LASTEXITCODE -ne 0) { throw "Could not upload the ASFAI source archive" }
}
finally {
  if (Test-Path -LiteralPath $resolvedStaging) {
    Remove-Item -LiteralPath $resolvedStaging -Recurse -Force
  }
}

$override = @(
  @{ name = "CONSTITUTION_COMMIT"; value = $constitutionCommit; type = "PLAINTEXT" },
  @{ name = "EDUCATION_COMMIT"; value = $educationCommit; type = "PLAINTEXT" },
  @{ name = "RELEASE_ID"; value = $releaseId; type = "PLAINTEXT" }
) | ConvertTo-Json -Compress
$buildId = aws codebuild start-build --region $Region --project-name $project `
  --environment-variables-override $override --query 'build.id' --output text
if ($LASTEXITCODE -ne 0) { throw "Could not start the ASFAI container build" }

do {
  Start-Sleep -Seconds 20
  $buildStatus = aws codebuild batch-get-builds --region $Region --ids $buildId `
    --query 'builds[0].buildStatus' --output text
  Write-Output "Container build: $buildStatus"
} while ($buildStatus -eq "IN_PROGRESS")
if ($buildStatus -ne "SUCCEEDED") { throw "ASFAI container build ended $buildStatus" }

foreach ($file in @("compose.yml", "Caddyfile", "host/deploy.sh", "host/status.sh")) {
  aws s3 cp (Join-Path $PSScriptRoot $file) "s3://$bucket/host/$($file -replace '^host/', '')" `
    --region $Region --only-show-errors
  if ($LASTEXITCODE -ne 0) { throw "Could not upload $file" }
}

aws ec2 wait instance-status-ok --region $Region --instance-ids $instanceId
$parameters = @{ commands = @(
  "aws s3 sync s3://$bucket/host /opt/asfai --region $Region",
  "bash /opt/asfai/deploy.sh",
  "bash /opt/asfai/status.sh"
) } | ConvertTo-Json -Compress
$commandId = aws ssm send-command --region $Region --instance-ids $instanceId `
  --document-name AWS-RunShellScript --parameters $parameters --timeout-seconds 1800 `
  --query 'Command.CommandId' --output text
if ($LASTEXITCODE -ne 0) { throw "Could not start the ASFAI host deployment" }

do {
  Start-Sleep -Seconds 10
  $commandStatus = aws ssm get-command-invocation --region $Region --command-id $commandId `
    --instance-id $instanceId --query Status --output text 2>$null
  Write-Output "Host deployment: $commandStatus"
} while ($commandStatus -in @("Pending", "InProgress", "Delayed"))

aws ssm get-command-invocation --region $Region --command-id $commandId --instance-id $instanceId `
  --query '{Status:Status,Output:StandardOutputContent,Errors:StandardErrorContent}' --output json
if ($commandStatus -ne "Success") { throw "ASFAI host deployment ended $commandStatus" }
Write-Output "ASFAI AWS is running release $releaseId."
