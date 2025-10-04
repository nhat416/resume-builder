#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script to apply k8s manifests in the correct order.
# Usage:
#  DATABASE_URL="postgres://..." ./k8s/deploy.sh

NAMESPACE="resume-builder"

echo "==> Ensuring namespace '$NAMESPACE' exists"
kubectl apply -f namespace.yaml

echo "==> Creating or applying secret 'resume-builder-secret'"
if [ -n "${DATABASE_URL:-}" ]; then
  echo "Using DATABASE_URL from environment to create secret"
  kubectl create secret generic resume-builder-secret \
    --from-literal=DATABASE_URL="$DATABASE_URL" \
    -n "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
else
  echo "No DATABASE_URL env var set — applying secret.yaml if present"
  kubectl apply -f secret.yaml || true
fi

echo "==> Applying deployment"
kubectl apply -f deployment.yaml

echo "==> Applying service"
kubectl apply -f service.yaml

echo "==> Applying ingress (if present)"
kubectl apply -f ingress.yaml || true

echo "==> Done."

