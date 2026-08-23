# ASFAI AWS deployment

ASFAI Constitution and ASFAI Education are one coordinated, manually released AWS deployment. The architecture follows the Fenix v3 production model while keeping the two GitHub repositories and two application images separate.

## Runtime

| Host | Container | Internal target |
| --- | --- | --- |
| `constitution.asfai.org` | `constitution` | `constitution:3000` |
| `education.asfai.org` | `education` | `education:3000` |
| `constitution.asfai.org/education/*` | `constitution` rewrite | `education:3000/education/*` |

One `t3.medium` EC2 instance runs Docker Compose and Caddy behind an Elastic IP. Systems Manager is the only administration path; SSH is not exposed. CodeBuild creates the two standalone Next.js images, ECR retains the images, Secrets Manager supplies runtime configuration, and an encrypted S3 bucket carries committed source and host configuration.

The education service continues to fetch and cache the public Marble competency graph from its upstream GitHub source. The deployment does not copy or fork the Marble taxonomy files.

The stack also outputs `TemporaryMcpOrigin`, an AWS-issued HTTPS origin for use
before DNS cutover. Append `/api/mcp` for the constitution server or
`/education/api/mcp` for the education server. API Gateway limits this
temporary path to 30-second backend calls; the custom-domain endpoints connect
directly to Caddy and retain the applications' 60-second MCP limit.

## Release procedure

The release is deliberately on demand. A GitHub push does not build or deploy AWS.

1. Commit the desired state of both repositories.
2. From `asfai-constitution`, create or update the stack:

   ```powershell
   ./deploy/aws/deploy-stack.ps1
   ```

3. Import the existing sanitized Vercel production environment into AWS Secrets Manager:

   ```powershell
   ./deploy/aws/import-vercel-secrets.ps1
   ```

4. Build and deploy both committed repositories:

   ```powershell
   ./deploy/aws/deploy-now.ps1 -EducationRepoPath ../asfai-education
   ```

The deploy script refuses dirty repositories, archives the two exact commits, waits for CodeBuild, updates the EC2 host through SSM, and verifies both containers internally.

## DNS and TLS

After the host passes its internal checks, point both DNS names to the stack's `PublicIp` output:

- replace the existing `constitution.asfai.org` Vercel CNAME with an A record;
- add an `education.asfai.org` A record.

Caddy obtains and renews both certificates after DNS resolves.

## Vercel freeze and rollback

Disconnect the Git repository from both Vercel projects only after the AWS images and host pass pre-cutover validation:

- `asfai-constitution`
- `asfai-education`

Keep the last Vercel deployments during the observation window. Disconnecting Git prevents future pushes from creating Vercel deployments but leaves the old deployments available for rollback. Rollback is a DNS change back to the prior Vercel target.

## Availability posture

This first version intentionally mirrors the cost-focused Fenix model: reproducible infrastructure, encrypted storage, image scanning, container restart policies, a fixed IP, and SSM administration on one host. The EC2 instance remains a single availability point. The same images can later move behind an Application Load Balancer and Auto Scaling Group without reconnecting Vercel or changing the application storage model.
