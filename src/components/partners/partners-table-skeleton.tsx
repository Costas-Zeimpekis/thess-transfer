import { Skeleton } from "@/components/ui/skeleton";

export default function PartnersTableSkeleton() {
	return (
		<div className="flex gap-6 items-stretch h-full">
			{/* Table panel */}
			<div className="flex-1 min-w-0 bg-white p-4 flex flex-col h-full">
				{/* Toolbar */}
				<div className="flex items-center gap-3 mb-6">
					<Skeleton className="h-9 w-32" />
					<div className="flex-1" />
					<Skeleton className="h-9 w-36" />
				</div>

				{/* Table */}
				<div className="rounded-md border overflow-auto">
					{/* Header row */}
					<div className="flex border-b border-t-4 border-t-[#f9cf44] bg-muted/50">
						<div className="w-10 bg-[#f9cf44] py-3 shrink-0" />
						{["40%", "30%", "30%"].map((w, i) => (
							<div key={i} className="px-4 py-3" style={{ width: w }}>
								<Skeleton className="h-4 w-3/4" />
							</div>
						))}
					</div>

					{/* Rows */}
					{Array.from({ length: 10 }).map((_, i) => (
						<div key={i} className="flex border-b last:border-0 items-center">
							<div className="w-10 px-2 py-3 shrink-0">
								<Skeleton className="h-4 w-6" />
							</div>
							<div className="px-4 py-3" style={{ width: "40%" }}>
								<Skeleton className="h-4 w-4/5" />
							</div>
							<div className="px-4 py-3" style={{ width: "30%" }}>
								<Skeleton className="h-4 w-3/4" />
							</div>
							<div className="px-4 py-3" style={{ width: "30%" }}>
								<Skeleton className="h-4 w-2/3" />
							</div>
						</div>
					))}
				</div>

				{/* Pagination */}
				<div className="flex items-center justify-between mt-4">
					<Skeleton className="h-4 w-32" />
					<div className="flex gap-1">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-8 w-8 rounded" />
						))}
					</div>
				</div>
			</div>

			{/* Filter sidebar */}
			<aside className="w-80 shrink-0">
				<div className="rounded-md border p-4 space-y-4 bg-[#333333]">
					<Skeleton className="h-8 w-full bg-white/20" />
					<div className="space-y-2 pt-2">
						<Skeleton className="h-3 w-12 bg-white/20" />
						<Skeleton className="h-8 w-full bg-white/20" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-3 w-16 bg-white/20" />
						<Skeleton className="h-8 w-full bg-white/20" />
					</div>
					<div className="flex flex-col gap-2 pt-4">
						<Skeleton className="h-8 w-full bg-white/20" />
						<Skeleton className="h-8 w-full bg-white/20" />
					</div>
				</div>
			</aside>
		</div>
	);
}
