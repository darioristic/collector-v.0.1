import { Suspense } from "react";

import { ProjectDetailsView } from "@/components/projects/project-details-view";
import { ProjectDetailsSkeleton } from "@/components/projects/project-details-skeleton";
import {
  ProjectDetailsErrorBoundary,
  ProjectDetailsNotFoundState
} from "@/components/projects/project-details-error";

type ProjectDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  const { id } = await params;
  const projectId = normaliseProjectId(id);

  if (!projectId) {
    return <ProjectDetailsNotFoundState />;
  }

  if (!isValidUuid(projectId)) {
    return <ProjectDetailsNotFoundState projectId={projectId} variant="invalid" />;
  }

  return (
    <ProjectDetailsErrorBoundary projectId={projectId}>
      <Suspense fallback={<ProjectDetailsSkeleton />}>
        <ProjectDetailsView projectId={projectId} />
      </Suspense>
    </ProjectDetailsErrorBoundary>
  );
}

function normaliseProjectId(id: string | undefined): string | null {
  if (!id) {
    return null;
  }

  const trimmed = id.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return decodeURIComponent(trimmed);
  } catch {
    return trimmed;
  }
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return uuidRegex.test(value);
}

