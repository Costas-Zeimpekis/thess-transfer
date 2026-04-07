import { Skeleton } from "@/components/ui/skeleton";

export default function PartnerFormSkeleton() {
	return (
		<div className="max-w-lg">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<Skeleton className="h-9 w-9 rounded-md" />
				<Skeleton className="h-8 w-56" />
			</div>

			{/* Form fields */}
			<div className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-9 w-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-16" />
					<Skeleton className="h-9 w-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-9 w-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-40" />
					<Skeleton className="h-20 w-full" />
				</div>
				{/* Buttons */}
				<div className="flex gap-3 pt-2">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-28" />
				</div>
			</div>
		</div>
	);
}
