param(
  [string]$Region = "us-west-2",
  [string]$StackName = "asfai-production",
  [string]$InstanceType = "t3.medium",
  [string]$EducationPublicOrigin = "https://constitution.asfai.org"
)

$ErrorActionPreference = "Stop"
$template = Join-Path $PSScriptRoot "cloudformation.yml"

aws cloudformation validate-template --region $Region --template-body "file://$template" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "CloudFormation validation failed" }

aws cloudformation deploy --region $Region --stack-name $StackName `
  --template-file $template `
  --parameter-overrides "InstanceType=$InstanceType" "EducationPublicOrigin=$EducationPublicOrigin" `
  --capabilities CAPABILITY_IAM `
  --no-fail-on-empty-changeset
if ($LASTEXITCODE -ne 0) { throw "CloudFormation deployment failed" }

aws cloudformation describe-stacks --region $Region --stack-name $StackName `
  --query "Stacks[0].Outputs" --output table
