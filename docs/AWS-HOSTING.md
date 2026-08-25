# ASFAI AWS deployment

ASFAI Constitution and ASFAI Education are one coordinated, manually released AWS deployment. The architecture follows the Fenix v3 production model while keeping the two GitHub repositories and two application images separate.

## Runtime

| Host | Container | Internal target |
| --- | --- | --- |
| `constitution.asfai.org` | Vercel `constitution` deployment | Constitution application |
| `constitution.asfai.org/education/*` | Vercel rewrite | AWS education service |
| AWS `TemporaryMcpOrigin` | API Gateway | AWS constitution and education services |

One `t3.medium` EC2 instance runs Docker Compose and Caddy behind an Elastic IP. Systems Manager is the only administration path; SSH is not exposed. CodeBuild creates the two standalone Next.js images, ECR retains the images, Secrets Manager supplies runtime configuration, and an encrypted S3 bucket carries committed source and host configuration. A separate encrypted EBS volume, retained across stack or host replacement, stores accountless connector authorization and the Pod-less fallback; it is mounted at `/var/lib/asfai` and is not included in application images.

The education service continues to fetch and cache the public Marble competency graph from its upstream GitHub source. The deployment does not copy or fork the Marble taxonomy files.

The stack outputs `TemporaryMcpOrigin`, an AWS-issued HTTPS origin that remains
available without an ASFAI DNS change. Append `/api/mcp` for the constitution
server, `/education/api/mcp` for the education server, or `/education` for the
optional education browser. API Gateway limits these paths to 30-second backend
calls. Moving `education.asfai.org` is not a release prerequisite.

The plugin uses one authenticated remote MCP at `/education/api/mcp`. The connector uses OAuth 2.1 with PKCE, prefers a connected Solid Pod for learner and educator records, and exposes Google Classroom through the same endpoint. The stack's `EducationPublicOrigin` controls externally advertised OAuth and MCP URLs while the AWS-issued URL remains usable as a transport endpoint. The education secret must include `ASFAI_REMOTE_TOKEN_SECRET` and `ASFAI_REMOTE_ENCRYPTION_KEY`. Classroom access additionally requires `ASFAI_GOOGLE_CLASSROOM_CLIENT_ID` and `ASFAI_GOOGLE_CLASSROOM_CLIENT_SECRET` for a Google Web OAuth client whose redirect URI is `<EducationPublicOrigin>/education/oauth/google/callback`.

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

   Vercel does not export values marked `sensitive`. If the production project
   uses that type, pass a trusted dotenv export containing the original values:

   ```powershell
   ./deploy/aws/import-vercel-secrets.ps1 `
     -ConstitutionEnvironmentPath C:\secure\asfai-constitution.env
   ```

   The importer refuses to write an incomplete constitution secret. Never
   commit this dotenv file.

4. Build and deploy both committed repositories:

   ```powershell
   ./deploy/aws/deploy-now.ps1 -EducationRepoPath ../asfai-education
   ```

The deploy script refuses dirty repositories, archives the two exact commits, waits for CodeBuild, updates the EC2 host through SSM, and verifies both containers internally.

## DNS and TLS

At any later chosen time, after the host passes its internal checks, the DNS names may be pointed to the stack's `PublicIp` output:

- optionally replace the existing `constitution.asfai.org` Vercel CNAME with an A record;
- add an `education.asfai.org` A record.

Caddy obtains and renews both certificates after DNS resolves.

## Vercel freeze and rollback

Disconnect the Git repository from both Vercel projects only after the AWS images and host pass pre-cutover validation:

- `asfai-constitution`
- `asfai-education`

Keep the last Vercel deployments during the observation window. Disconnecting Git prevents future pushes from creating Vercel deployments but leaves the old deployments available for rollback. Rollback is a DNS change back to the prior Vercel target.

## Availability posture

This first version intentionally mirrors the cost-focused Fenix model: reproducible infrastructure, encrypted storage, image scanning, container restart policies, a fixed IP, and SSM administration on one host. The EC2 instance remains a single availability point. The same images can later move behind an Application Load Balancer and Auto Scaling Group without reconnecting Vercel or changing the application storage model.
