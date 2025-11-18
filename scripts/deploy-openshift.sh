#!/usr/bin/env bash
set -euo pipefail

# OpenShift production deployment script (Tekton-based)
# Usage:
#   PROJECT=crm-platform-prod REGISTRY=image-registry.openshift-image-registry.svc:5000 \
#   GIT_REPO_URL=https://github.com/darioristic/collector-v.0.1.git GIT_REVISION=main \
#   NOVU_APP_ID=xxxx NOVU_API_KEY=yyyy JWT_SECRET=zzzz \
#   ALLOWED_ORIGINS=https://dashboard.example.com,https://api.example.com \
#   CORS_ALLOWED_ORIGINS=https://dashboard.example.com \
#   bash scripts/deploy-openshift.sh

if ! command -v oc >/dev/null 2>&1; then
  echo "oc CLI nije instaliran" >&2
  exit 1
fi
if ! command -v tkn >/dev/null 2>&1; then
  echo "tkn CLI nije instaliran" >&2
  exit 1
fi

: "${PROJECT:?Set PROJECT (OpenShift namespace)}"
: "${REGISTRY:?Set REGISTRY (internal registry host)}"
: "${GIT_REPO_URL:?Set GIT_REPO_URL}"
: "${GIT_REVISION:=main}"
NOVU_APP_ID="${NOVU_APP_ID:-}"
NOVU_API_KEY="${NOVU_API_KEY:-}"
JWT_SECRET="${JWT_SECRET:-}"
ALLOWED_ORIGINS="${ALLOWED_ORIGINS:-}"
CORS_ALLOWED_ORIGINS="${CORS_ALLOWED_ORIGINS:-}"

echo "Switching project to ${PROJECT}"
oc project "${PROJECT}"

echo "Applying base resources"
oc apply -f openshift/imagestream.yaml
oc apply -f openshift/postgresql.yaml
oc apply -f openshift/redis.yaml
oc apply -f openshift/service.yaml
oc apply -f openshift/service-chat-service.yaml
oc apply -f openshift/service-notification-service.yaml
oc apply -f openshift/deploymentconfig.yaml
oc apply -f openshift/deploymentconfig-chat-service.yaml
oc apply -f openshift/deploymentconfig-notification-service.yaml
oc apply -R -f openshift/tekton/tasks
oc apply -f openshift/tekton/serviceaccount-privileged.yaml
oc apply -f openshift/tekton/eventlistener.yaml
oc apply -f openshift/tekton/triggerbinding.yaml
oc apply -f openshift/tekton/triggertemplate.yaml
oc apply -f openshift/tekton/pipeline.yaml

echo "Applying runtime config (secrets + configmaps) with placeholders"
oc apply -f openshift/runtime-config.yaml

if [ -n "${JWT_SECRET}" ] || [ -n "${NOVU_API_KEY}" ] || [ -n "${NOVU_APP_ID}" ] || [ -n "${ALLOWED_ORIGINS}" ] || [ -n "${CORS_ALLOWED_ORIGINS}" ]; then
  echo "Patching secrets with production values (no output of secret data)"
  oc patch secret collector-api-secrets --type=merge \
    -p "{\"stringData\":{\"JWT_SECRET\":\"${JWT_SECRET}\",\"NOVU_API_KEY\":\"${NOVU_API_KEY}\",\"NOVU_APP_ID\":\"${NOVU_APP_ID}\",\"ALLOWED_ORIGINS\":\"${ALLOWED_ORIGINS}\",\"CORS_ALLOWED_ORIGINS\":\"${CORS_ALLOWED_ORIGINS}\"}}" >/dev/null || true

  oc patch secret collector-chat-service-secrets --type=merge \
    -p "{\"stringData\":{\"JWT_SECRET\":\"${JWT_SECRET}\",\"ALLOWED_ORIGINS\":\"${ALLOWED_ORIGINS}\"}}" >/dev/null || true

  oc patch secret collector-notification-service-secrets --type=merge \
    -p "{\"stringData\":{\"JWT_SECRET\":\"${JWT_SECRET}\",\"ALLOWED_ORIGINS\":\"${ALLOWED_ORIGINS}\"}}" >/dev/null || true
else
  echo "Skipping secret patch (no production values provided)"
fi

if [ -n "${NOVU_APP_ID}" ]; then
  echo "Patching dashboard ConfigMap for Novu app id"
  oc patch configmap dashboard-config --type=merge \
    -p "{\"data\":{\"NEXT_PUBLIC_NOVU_APP_ID\":\"${NOVU_APP_ID}\"}}" >/dev/null || true
else
  echo "Skipping dashboard ConfigMap patch for Novu app id"
fi

echo "Starting Tekton PipelineRun"
PR_NAME=$(oc create -f openshift/tekton/pipeline-run.yaml -o name | awk -F/ '{print $2}')
echo "Waiting for PipelineRun ${PR_NAME} to succeed"
oc wait --for=condition=Succeeded pipelinerun/${PR_NAME} --timeout=45m

echo "Exposing Routes (if not already exposed)"
oc get route api >/dev/null 2>&1 || oc expose service api --port=4000
oc get route dashboard >/dev/null 2>&1 || oc expose service dashboard --port=3000
oc get route chat-service >/dev/null 2>&1 || oc expose service chat-service --port=4001
oc get route notification-service >/dev/null 2>&1 || oc expose service notification-service --port=4002

echo "Waiting for deployments to be available"
oc wait --for=condition=available deployment/api --timeout=600s || true
oc wait --for=condition=available deployment/dashboard --timeout=600s || true
oc wait --for=condition=available deployment/chat-service --timeout=600s || true
oc wait --for=condition=available deployment/notification-service --timeout=600s || true

echo "Health checks"
oc exec deployment/api -- wget -qO- http://localhost:4000/api/health || true
oc exec deployment/chat-service -- wget -qO- http://localhost:4001/health || true
oc exec deployment/notification-service -- wget -qO- http://localhost:4002/health || true

echo "Deployment complete"
