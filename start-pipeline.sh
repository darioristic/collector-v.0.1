#!/bin/bash

# Start the pipeline with all required parameters
tkn pipeline start crm-monorepo-pipeline \
  --prefix-name crm-monorepo-monorepo-fix \
  --param git-repo-url=https://github.com/darioristic/collector-v.0.1.git \
  --param git-revision=main \
  --param registry=image-registry.openshift-image-registry.svc:5000/crm-platform-prod \
  --param namespace=crm-platform-prod \
  --param image-tag=$(date +%s) \
  --param database-secret-name=collector-api-secrets \
  --param database-secret-key=DATABASE_URL \
  --workspace name=shared-workspace,volumeClaimTemplate="spec=,metadata=crm-monorepo-workspace,accessModes=ReadWriteOnce,resources.requests.storage=5Gi" \
  --showlog