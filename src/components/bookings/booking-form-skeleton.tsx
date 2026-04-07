import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingFormSkeleton() {
	return (
		<div className="w-full flex gap-6 items-start">
			<div className="space-y-6 flex-1 min-w-0">
				{/* Header */}
				<div className="flex items-center justify-between bg-white p-4 rounded-xl">
					<div className="flex items-center gap-3">
						<Skeleton className="h-7 w-16 rounded-lg" />
						<Skeleton className="h-8 w-48" />
						<Skeleton className="h-6 w-24 rounded-full" />
					</div>
					<div className="flex gap-2">
						<Skeleton className="h-9 w-28" />
						<Skeleton className="h-9 w-28" />
						<Skeleton className="h-9 w-28" />
					</div>
				</div>

				<div className="flex flex-row gap-6 w-full items-stretch">
					{/* Left column */}
					<div className="flex-1 min-w-0 space-y-6">
						{/* Στοιχεία Κράτησης */}
						<Card className="h-[380px]">
							<CardHeader>
								<Skeleton className="h-5 w-40" />
								<div className="border-b-2 border-b-[#f9cf44]" />
							</CardHeader>
							<CardContent className="grid grid-cols-2 gap-4">
								{/* Booking type toggle */}
								<div className="col-span-2 flex gap-2">
									<Skeleton className="h-8 w-28 rounded-lg" />
									<Skeleton className="h-8 w-24 rounded-lg" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-36" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-9 w-full" />
								</div>
							</CardContent>
						</Card>

						{/* Στοιχεία Πελάτη */}
						<Card className="h-[202px]">
							<CardHeader>
								<Skeleton className="h-5 w-36" />
								<div className="border-b-2 border-b-[#f9cf44]" />
							</CardHeader>
							<CardContent className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-9 w-full" />
								</div>
							</CardContent>
						</Card>

						{/* Οικονομικά */}
						<Card>
							<CardHeader>
								<Skeleton className="h-5 w-24" />
								<div className="border-b-2 border-b-[#f9cf44]" />
							</CardHeader>
							<CardContent className="grid grid-cols-3 gap-4">
								<div className="space-y-2">
									<Skeleton className="h-4 w-32" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-9 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-9 w-full" />
								</div>
							</CardContent>
						</Card>

						{/* Ανάθεση */}
						<Card>
							<CardHeader>
								<Skeleton className="h-5 w-20" />
								<div className="border-b-2 border-b-[#f9cf44]" />
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex gap-2">
									<Skeleton className="h-8 w-32 rounded-md" />
									<Skeleton className="h-8 w-28 rounded-md" />
								</div>
								<div className="grid grid-cols-3 gap-4">
									<div className="space-y-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-9 w-full" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-16" />
										<Skeleton className="h-9 w-full" />
									</div>
									<div className="space-y-2">
										<Skeleton className="h-4 w-24" />
										<Skeleton className="h-9 w-full" />
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right column */}
					<div className="flex-1 min-w-0 flex flex-col gap-6">
						{/* Μικροέξοδα */}
						<Card className="h-[380px]">
							<CardHeader>
								<Skeleton className="h-5 w-24" />
								<div className="border-b-2 border-b-[#f9cf44]" />
							</CardHeader>
							<CardContent className="space-y-3">
								{Array.from({ length: 4 }).map((_, i) => (
									<div key={i} className="flex justify-between gap-3">
										<div className="space-y-1">
											<Skeleton className="h-4 w-32" />
											<Skeleton className="h-3 w-24" />
										</div>
										<Skeleton className="h-4 w-14" />
									</div>
								))}
							</CardContent>
						</Card>

						{/* Σημειώσεις */}
						<Card className="h-[202px]">
							<CardHeader>
								<Skeleton className="h-5 w-24" />
								<div className="border-b-2 border-b-[#f9cf44]" />
							</CardHeader>
							<CardContent>
								<Skeleton className="h-[127px] w-full" />
							</CardContent>
						</Card>

						{/* Ιστορικό */}
						<Card className="flex-1">
							<CardHeader>
								<Skeleton className="h-5 w-20" />
								<div className="border-b-2 border-b-[#f9cf44]" />
							</CardHeader>
							<CardContent className="space-y-3">
								{Array.from({ length: 5 }).map((_, i) => (
									<div key={i} className="flex gap-3">
										<Skeleton className="h-4 w-28 shrink-0" />
										<Skeleton className="h-4 w-40" />
									</div>
								))}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
