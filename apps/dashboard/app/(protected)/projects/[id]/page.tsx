import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ProjectDetailsView } from "@/components/projects/project-details-view";
import { ProjectDetailsSkeleton } from "@/components/projects/project-details-skeleton";

type ProjectDetailsPageProps = {
  params: {
    id: string;
  };
};

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function ProjectDetailsPage({ params }: ProjectDetailsPageProps) {
  if (!uuidRegex.test(params.id)) {
    notFound();
  }

  return (
    <Suspense fallback={<ProjectDetailsSkeleton />}>
      <ProjectDetailsView projectId={params.id} />
    </Suspense>
  );
}

