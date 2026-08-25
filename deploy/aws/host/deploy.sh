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
temporary_mcp_origin="$(stack_output TemporaryMcpOrigin)"
education_data_volume_id="$(stack_output EducationDataVolumeId)"

volume_serial="${education_data_volume_id//-/}"
education_data_device=""
for _ in {1..60}; do
  education_data_device="$(lsblk -ndo PATH,SERIAL | awk -v serial="$volume_serial" '$2 == serial { print $1; exit }')"
  [[ -n "$education_data_device" ]] && break
  sleep 2
done
if [[ -z "$education_data_device" ]]; then
  echo "Could not locate attached ASFAI education data volume $education_data_volume_id" >&2
  exit 1
fi
if ! blkid "$education_data_device" >/dev/null 2>&1; then
  mkfs.ext4 -F "$education_data_device"
fi
education_data_uuid="$(blkid -s UUID -o value "$education_data_device")"
mkdir -p /var/lib/asfai
if ! mountpoint -q /var/lib/asfai; then
  mount "$education_data_device" /var/lib/asfai
fi
if ! grep -q "UUID=${education_data_uuid} /var/lib/asfai " /etc/fstab; then
  echo "UUID=${education_data_uuid} /var/lib/asfai ext4 defaults,nofail 0 2" >> /etc/fstab
fi
chmod 700 /var/lib/asfai

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
TEMPORARY_MCP_ORIGIN=$temporary_mcp_origin
EOF

cd /opt/asfai
docker compose --env-file images.env pull
docker compose --env-file images.env up -d --remove-orphans
docker compose --env-file images.env restart caddy
docker image prune -f
