import { Skeleton } from "@/components/ui/skeleton";

export default function ProviderFormSkeleton() {
	return (
		<div className="max-w-lg">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<Skeleton className="h-9 w-9 rounded-md" />
				<Skeleton className="h-8 w-52" />
			</div>

			{/* Form fields */}
			<div className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-9 w-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-9 w-full" />
				</div>
				{/* Buttons */}
				<div className="flex gap-3 pt-2">
					<Skeleton className="h-9 w-24" />
					<Skeleton className="h-9 w-28" />
				</div>
			</div>

			{/* Email section */}
			<div className="mt-8 space-y-4">
				<div className="border-t pt-6">
					<Skeleton className="h-6 w-40 mb-4" />
				</div>
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
						<div className="flex items-center gap-2">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-5 w-20 rounded-full" />
						</div>
						<Skeleton className="h-8 w-8 rounded-md shrink-0" />
					</div>
				))}
				<div className="border-t pt-4 flex gap-2">
					<Skeleton className="h-9 flex-1" />
					<Skeleton className="h-9 w-40" />
					<Skeleton className="h-9 w-9" />
				</div>
			</div>
		</div>
	);
}
