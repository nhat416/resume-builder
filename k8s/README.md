# k8s manifests

This folder contains example Kubernetes manifests for running the Resume Builder app.

Files
- `namespace.yaml` — creates the `resume-builder` namespace used by the other manifests.
- `secret.yaml` — example `Opaque` secret named `resume-builder-secret` containing `DATABASE_URL`. Replace values with your production DB connection string or create the secret with `kubectl create secret`.
- `deployment.yaml` — Deployment for the app (image: `nhat416/resume-builder:latest`). Includes container port `3000`, and HTTP readiness/liveness probes that hit `/api/health`.
- `service.yaml` — Service exposing the Deployment. Currently configured as `NodePort` forwarding port `80` to container port `3000`. Change to `LoadBalancer` if your cluster supports it.
- `ingress.yaml` — Optional Ingress resource (example host `resume.example.com`); update the host and ensure an ingress controller is installed.

Quick start

1. Build and push your image (if using a registry):

```bash
docker build -t nhat416/resume-builder:latest .
# docker push nhat416/resume-builder:latest
```

2. Apply the manifests

```bash
kubectl apply -f namespace.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
# optional
kubectl apply -f ingress.yaml
```

Health checks
- The Deployment probes use `GET /api/health` on port `3000` for readiness and liveness. The app includes a lightweight endpoint at `src/app/api/health/route.ts` that returns `{ "status": "ok" }`.

Useful kubectl commands
- `kubectl get pods -n resume-builder`
- `kubectl describe pod <pod> -n resume-builder` (shows probe events)
- `kubectl logs deployment/resume-builder -n resume-builder`
- `kubectl port-forward svc/resume-builder 3000:80 -n resume-builder`

Notes
- Update `deployment.yaml` if you want to reference a different image tag or registry.
- If you enable DB checks in the health endpoint, probes will depend on DB availability — tune probe values accordingly.

Creating secrets (examples)

- Create a secret from an environment variable (recommended for CI):

```bash
DATABASE_URL="postgres://user:pass@host:5432/dbname" \
  kubectl create secret generic resume-builder-secret \
  --from-literal=DATABASE_URL="$DATABASE_URL" -n resume-builder
```

- Create a secret from a file:

```bash
kubectl create secret generic resume-builder-secret \
  --from-file=./secrets/production.env -n resume-builder
```

- Apply the included `secret.yaml` (already populated in this repo as an example):

```bash
kubectl apply -f secret.yaml
```

Deploy script

This directory includes a small helper script `deploy.sh` that applies manifests in the recommended order and will create the `resume-builder-secret` from the `DATABASE_URL` environment variable if provided.

Usage:

```bash
# supply DATABASE_URL in the environment (optional)
DATABASE_URL="postgres://user:pass@host:5432/dbname" ./deploy.sh
```

The script performs:
- `kubectl apply -f namespace.yaml`
- creates or applies the secret (`resume-builder-secret`) using `$DATABASE_URL` if set, otherwise applies `secret.yaml`
- applies `deployment.yaml`, `service.yaml`, and `ingress.yaml` (if present)

