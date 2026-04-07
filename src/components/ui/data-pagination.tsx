"use client";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [20, 30, 50];

type DataPaginationProps = {
	page: number;
	totalPages: number;
	total: number;
	pageSize: number;
	itemLabel?: string;
	onPageChange: (page: number) => void;
	onPageSizeChange: (size: number) => void;
};

export default function DataPagination({
	page,
	totalPages,
	total,
	pageSize,
	itemLabel = "εγγραφές",
	onPageChange,
	onPageSizeChange,
}: DataPaginationProps) {
	function getPages(): (number | "...before" | "...after")[] {
		const pages: (number | "...before" | "...after")[] = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
			return pages;
		}
		pages.push(1);
		if (page > 3) pages.push("...before");
		const start = Math.max(2, page - 1);
		const end = Math.min(totalPages - 1, page + 1);
		for (let i = start; i <= end; i++) pages.push(i);
		if (page < totalPages - 2) pages.push("...after");
		pages.push(totalPages);
		return pages;
	}

	const btnBase =
		"inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-md text-sm font-medium transition-colors select-none";

	return (
		<div className="flex items-center justify-between gap-4 mt-4 flex-wrap">
			{/* Left: page size selector */}
			<div className="flex items-center gap-2 text-sm">
				<span className="text-muted-foreground whitespace-nowrap">Ανά σελίδα:</span>
				<div className="flex gap-1">
					{PAGE_SIZE_OPTIONS.map((size) => (
						<button
							type="button"
							key={size}
							className={cn(
								btnBase,
								"px-3",
								size === pageSize
									? "bg-[#f9cf44] text-[#333333] font-bold"
									: "bg-[#333333] text-[#f9cf44] hover:bg-[#f9cf44] hover:text-[#333333]",
							)}
							onClick={() => {
								onPageSizeChange(size);
								onPageChange(1);
							}}
						>
							{size}
						</button>
					))}
				</div>
			</div>

			{/* Center: total count */}
			<div className="text-sm text-muted-foreground">
				<span className="font-semibold text-foreground">{total}</span>{" "}
				{itemLabel}
			</div>

			{/* Right: page navigation */}
			<div className="flex items-center gap-1">
				<button
					type="button"
					className={cn(btnBase, "bg-[#333333] text-[#f9cf44] hover:bg-[#f9cf44] hover:text-[#333333] disabled:opacity-40 disabled:pointer-events-none")}
					onClick={() => onPageChange(page - 1)}
					disabled={page === 1}
					aria-label="Προηγούμενη"
				>
					<FaChevronLeft size={12} />
				</button>

				{getPages().map((p) =>
					p === "...before" || p === "...after" ? (
						<span key={p} className="px-1 text-sm text-muted-foreground">
							…
						</span>
					) : (
						<button
							type="button"
							key={p}
							className={cn(
								btnBase,
								p === page
									? "bg-[#f9cf44] text-[#333333] font-bold"
									: "bg-[#333333] text-[#f9cf44] hover:bg-[#f9cf44] hover:text-[#333333]",
							)}
							onClick={() => onPageChange(p)}
						>
							{p}
						</button>
					),
				)}

				<button
					type="button"
					className={cn(btnBase, "bg-[#333333] text-[#f9cf44] hover:bg-[#f9cf44] hover:text-[#333333] disabled:opacity-40 disabled:pointer-events-none")}
					onClick={() => onPageChange(page + 1)}
					disabled={page === totalPages}
					aria-label="Επόμενη"
				>
					<FaChevronRight size={12} />
				</button>
			</div>
		</div>
	);
}
