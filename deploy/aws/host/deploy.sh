#!/usr/bin/env bash
set -euo pipefail

source /opt/asfai/host.env
stack_output() {
  aws cloudformation describe-stacks --region "$AWS_REGION" --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" --output text
}

deployment_bucket="$(stack_output DeploymentBucket)"
constitution_image="$(stack_output ConstitutionRepositoryUri):latest"
education_image="$(stack_output EducationRepositoryUri):latest"

aws s3 sync "s3://${deployment_bucket}/host" /opt/asfai --region "$AWS_REGION"

write_env() {
  local secret_id="$1"
  local target="$2"
  aws secretsmanager get-secret-value --region "$AWS_REGION" --secret-id "$secret_id" \
    --query SecretString --output text > "/opt/asfai/${target}.json"
  jq -r '
    del(
      .AWS_ACCESS_KEY_ID, .AWS_SECRET_ACCESS_KEY, .AWS_SESSION_TOKEN,
      .VERCEL_ACCESS_TOKEN, .VERCEL_URL, .VERCEL_ENV, .VERCEL,
      .AUTH_URL, .AUTH_TRUST_HOST, .EDUCATION_ORIGIN
    )
    | to_entries[]
    | "\(.key)=\(.value | tostring | @json)"
  ' "/opt/asfai/${target}.json" > "/opt/asfai/${target}.env"
  rm -f "/opt/asfai/${target}.json"
  chmod 600 "/opt/asfai/${target}.env"
}

write_env asfai/constitution constitution
write_env asfai/education education

registry="${constitution_image%%/*}"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$registry"
cat > /opt/asfai/images.env <<EOF
CONSTITUTION_IMAGE=$constitution_image
EDUCATION_IMAGE=$education_image
EOF

cd /opt/asfai
docker compose --env-file images.env pull
docker compose --env-file images.env up -d --remove-orphans
docker compose --env-file images.env restart caddy
docker image prune -f
