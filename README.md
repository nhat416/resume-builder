This is a **Resume Builder** application built with [Next.js](https://nextjs.org) and TypeScript.
Use this tool to compose your resume interactively and export it as a PDF.

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to use the resume builder.

You can start editing the form on the left; the live preview updates on the right. Click **Export to PDF** to download your resume.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Kubernetes Deployment

The repository already includes example manifests under the `k8s/` directory. The README below reflects those files so the instructions and manifests align.

1) Build and push your Docker image

```bash
# build a local image with the tag used by the manifests
docker build -t resume-builder:latest .
# If you use a registry, tag and push accordingly (example for Docker Hub):
# docker tag resume-builder:latest <docker-username>/resume-builder:latest
# docker push <docker-username>/resume-builder:latest
```

2) What the manifests contain

- `k8s/namespace.yaml` creates the `resume-builder` namespace.
- `k8s/deployment.yaml` deploys the app with `replicas: 2`, container image `resume-builder:latest`, and an environment variable sourced from the `resume-builder-secret` (see `k8s/secret.yaml`).
- `k8s/service.yaml` exposes the app as a `NodePort` service forwarding external port `80` to container port `3000`.
- `k8s/ingress.yaml` is provided and uses host `resume.example.com`; update the host to your domain if you use the ingress.
- `k8s/secret.yaml` contains the `DATABASE_URL` secret used by the Deployment. Update or replace it with your production credentials.

3) Apply manifests

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
# optional (if you run an ingress controller)
kubectl apply -f k8s/ingress.yaml
```

4) Common operations

- Check pods: `kubectl get pods -n resume-builder`
- View logs: `kubectl logs -f deployment/resume-builder -n resume-builder`
- Port-forward locally: `kubectl port-forward svc/resume-builder 3000:80 -n resume-builder`
- Scale: `kubectl scale deployment resume-builder --replicas=5 -n resume-builder`
- Rolling update (set a new image): `kubectl set image deployment/resume-builder resume-builder=<image>:tag -n resume-builder`

5) Autoscaling (example)

```bash
kubectl autoscale deployment resume-builder --cpu-percent=60 --min=2 --max=10 -n resume-builder
```

Notes
- The manifests reference the Docker Hub image `nhat416/resume-builder:latest`. If you prefer to use a different registry or tag, update `k8s/deployment.yaml` to reference that image (for example `ghcr.io/your-org/resume-builder:tag`).
- The Deployment expects an existing secret `resume-builder-secret` with key `DATABASE_URL`; update `k8s/secret.yaml` or supply the secret via `kubectl create secret`.
- The Service in `k8s/service.yaml` is `NodePort`; change it to `LoadBalancer` if your cluster supports provisioning external load balancers.
- Consider adding readiness and liveness probes in `k8s/deployment.yaml` if your app needs health checks.

If you want, I can:
- Update `k8s/deployment.yaml` to reference a registry image (e.g. include `<docker-username>/resume-builder:latest`).
- Add readiness/liveness probes to `k8s/deployment.yaml`.
- Create a short `k8s/README.md` describing the manifests in the repo.

There is also a small deploy helper script in `k8s/deploy.sh` that applies the manifests in the recommended order and can create the `resume-builder-secret` from an environment variable.

Usage:

```bash
# optional: set DATABASE_URL in the environment to create the secret automatically
DATABASE_URL="postgres://user:pass@host:5432/dbname" ./k8s/deploy.sh
```

The script will:
- ensure the `resume-builder` namespace exists
- create or apply the `resume-builder-secret` (from env or `k8s/secret.yaml`)
- apply `k8s/deployment.yaml`, `k8s/service.yaml`, and `k8s/ingress.yaml` (if present)

CI/CD (GitHub Actions)

This repository includes a GitHub Actions workflow at `.github/workflows/ci-cd.yml` that:

- builds a multi-architecture Docker image (for `linux/amd64` and `linux/arm64`) and pushes images to Docker Hub,
- tags images with the commit SHA and `latest` when pushing from the `main` branch, and also tags with the semantic version when the workflow is triggered by a Git tag (for example `v1.2.3`),
- configures `kubectl` from a base64-encoded kubeconfig stored in a repository secret,
- runs `k8s/deploy.sh` to apply manifests and create the secret (if `DATABASE_URL` is provided as a secret).

Required repository secrets (set in GitHub > Settings > Secrets & variables > Actions):

- `DOCKERHUB_USERNAME` — Docker Hub username used to push the image.
- `DOCKERHUB_TOKEN` — Docker Hub access token or password.
- `KUBECONFIG` — base64-encoded kubeconfig file for the target cluster (the workflow decodes this into `$HOME/.kube/config`).
- `DATABASE_URL` — (optional) database connection string; if present the workflow will create/update the `resume-builder-secret` from it.

Example to create a base64 kubeconfig locally:

```bash
base64 ~/.kube/config | pbcopy   # macOS (copies to clipboard)
# or
base64 ~/.kube/config > kubeconfig.base64
```

Then paste the base64 string into the `KUBECONFIG` secret.

Pushes to the `main` branch trigger the workflow.

Auto-incremented app version

The CI workflow automatically generates an app version at build time. It reads the base version from `package.json` and appends a build identifier derived from the Git commit count, producing a version like `0.1.0+build.123`.

This generated version is passed into the Docker build as the `APP_VERSION` build-arg and written into `package.json` inside the image, so the app's `/api/version` endpoint and the landing-page badge reflect the build-specific version.

**Health Checks & Probes**

- The app exposes a lightweight health endpoint at `GET /api/health` implemented in `src/app/api/health/route.ts`. It returns HTTP `200` with JSON `{ "status": "ok" }` when the app is responding.
- `k8s/deployment.yaml` configures both a readiness and a liveness probe that query this endpoint:
  - Readiness probe: checks `/api/health` to decide if the pod should receive traffic (removes pod from Service endpoints while failing).
  - Liveness probe: checks `/api/health` to detect unhealthy pods and restart them when the probe fails repeatedly.

Probe configuration (as provided in `k8s/deployment.yaml`):

```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 20
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3
```

Notes:

- The `/api/health` endpoint is intentionally lightweight to keep probes fast and reliable. This avoids making pod availability dependent on external services.
- If you want health to include database connectivity (for example via Prisma), you can extend `src/app/api/health/route.ts` to perform a quick DB query — be aware this will make readiness/liveness depend on DB availability and may cause pods to be restarted or marked unready if the DB is slow or temporarily unreachable.
- Tune probe timings to match your application's startup characteristics. Use longer `initialDelaySeconds` if the app needs extra time to bootstrap.
- Inspect probe status with `kubectl describe pod <pod-name> -n resume-builder` and view probe-related events in the output.
- You can exercise the health endpoint locally: start the app (`npm run dev`) and run `curl http://localhost:3000/api/health`.
