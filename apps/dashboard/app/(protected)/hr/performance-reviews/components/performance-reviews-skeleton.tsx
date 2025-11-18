import { Skeleton } from "@/components/ui/skeleton";

export default function PerformanceReviewsSkeleton() {
	return (
		<div className="space-y-4">
			<Skeleton className="h-12 w-full rounded-lg" />
			<div className="hidden flex-col gap-3 lg:flex">
				{Array.from({ length: 5 }).map((_, index) => (
					<Skeleton key={index} className="h-16 w-full rounded-lg" />
				))}
			</div>
			<div className="space-y-3 lg:hidden">
				{Array.from({ length: 4 }).map((_, index) => (
					<Skeleton key={index} className="h-24 w-full rounded-lg" />
				))}
			</div>
		</div>
	);
}
