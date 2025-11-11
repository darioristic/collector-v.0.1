import { Suspense } from "react";

import { ProjectDetailsView } from "@/components/projects/project-details-view";
import { ProjectDetailsSkeleton } from "@/components/projects/project-details-skeleton";

type ProjectDetailsPageProps = {
  params: {
    id: string;
  };
};

export default function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  return (
    <Suspense fallback={<ProjectDetailsSkeleton />}>
      <ProjectDetailsView projectId={params.id} />
    </Suspense>
  );
}

