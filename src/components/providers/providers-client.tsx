"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSort, FaSortDown, FaSortUp, FaSlidersH, FaTimes } from "react-icons/fa";
import { Button, buttonVariants } from "@/components/ui/button";
import DataPagination from "@/components/ui/data-pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Navigation from "../ui/navigation";
import { type Provider } from "./provider-sheet";

type ProvidersClientProps = {
	providers: Provider[];
};

function SortIcon({
	col,
	sortCol,
	sortDir,
}: {
	col: string;
	sortCol: string | null;
	sortDir: "asc" | "desc";
}) {
	if (sortCol !== col)
		return <FaSort className="shrink-0 opacity-40 text-[#333]" size={22} />;
	return sortDir === "asc" ? (
		<FaSortUp className="shrink-0 text-[#333]" size={22} />
	) : (
		<FaSortDown className="shrink-0 text-[#333]" size={22} />
	);
}

export default function ProvidersClient({
	providers: initialProviders,
}: ProvidersClientProps) {
	const router = useRouter();
	const [sortCol, setSortCol] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [filtersOpen, setFiltersOpen] = useState(false);

	const [searchName, setSearchName] = useState("");
	const [searchSlug, setSearchSlug] = useState("");

	const [applied, setApplied] = useState({ name: "", slug: "" });

	function handleApply() {
		setPage(1);
		setApplied({ name: searchName, slug: searchSlug });
	}

	function handleReset() {
		setSearchName("");
		setSearchSlug("");
		setPage(1);
		setApplied({ name: "", slug: "" });
	}

	function handleSort(col: string) {
		setPage(1);
		if (sortCol === col) {
			setSortDir(sortDir === "asc" ? "desc" : "asc");
		} else {
			setSortCol(col);
			setSortDir("asc");
		}
	}

	const filteredAndSorted = useMemo(() => {
		let list = initialProviders;

		if (applied.name)
			list = list.filter((p) =>
				p.name.toLowerCase().includes(applied.name.toLowerCase()),
			);
		if (applied.slug)
			list = list.filter((p) =>
				p.slug.toLowerCase().includes(applied.slug.toLowerCase()),
			);

		if (!sortCol) return list;
		return [...list].sort((a, b) => {
			let aVal: string | number = "";
			let bVal: string | number = "";
			switch (sortCol) {
				case "id":
					aVal = a.id;
					bVal = b.id;
					break;
				case "name":
					aVal = a.name;
					bVal = b.name;
					break;
				case "slug":
					aVal = a.slug;
					bVal = b.slug;
					break;
			}
			if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
			return 0;
		});
	}, [initialProviders, applied, sortCol, sortDir]);

	const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
	const paginatedProviders = filteredAndSorted.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	const activeFilterCount = [
		applied.name !== "",
		applied.slug !== "",
	].filter(Boolean).length;

	return (
		<div className="flex gap-2 items-stretch h-full">
			{/* Main content */}
			<div className="flex-1 min-w-0 bg-white p-4 flex flex-col h-full">
				<div className="flex items-center gap-3 mb-6">
					<Navigation />
					<div className="flex-1" />
					<Link href="/providers/new" className={buttonVariants()}>
						Νέος Πάροχος
					</Link>
				</div>
				<div className="rounded-md border overflow-auto" style={{ height: "100%" }}>
					<Table>
						<TableHeader>
							<TableRow className="bg-muted/50 border-t-[#f9cf44] border-t-4">
								<TableHead
									className="font-extrabold overflow-hidden p-0 cursor-pointer select-none w-[22px]"
									onClick={() => handleSort("id")}
								>
									<div
										className="flex items-center justify-start h-full px-4 py-3 bg-[#f9cf44] text-[#333333]"
										style={{ paddingLeft: 10 }}
									>
										<div className="flex items-center gap-1">
											#
											<SortIcon col="id" sortCol={sortCol} sortDir={sortDir} />
										</div>
									</div>
								</TableHead>
								<TableHead
									className="font-extrabold cursor-pointer select-none"
									onClick={() => handleSort("name")}
								>
									<div className="flex items-center gap-1">
										Όνομα
										<SortIcon col="name" sortCol={sortCol} sortDir={sortDir} />
									</div>
								</TableHead>
								<TableHead
									className="font-extrabold cursor-pointer select-none"
									onClick={() => handleSort("slug")}
								>
									<div className="flex items-center gap-1">
										Slug
										<SortIcon col="slug" sortCol={sortCol} sortDir={sortDir} />
									</div>
								</TableHead>
								<TableHead className="font-extrabold">
									Emails
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredAndSorted.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={4}
										className="text-center text-muted-foreground py-8"
									>
										Δεν βρέθηκαν πάροχοι
									</TableCell>
								</TableRow>
							)}
							{paginatedProviders.map((provider) => (
								<TableRow
									key={provider.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => router.push(`/providers/${provider.id}`)}
								>
									<TableCell className="font-mono text-sm">{provider.id}</TableCell>
									<TableCell className="font-medium">{provider.name}</TableCell>
									<TableCell>
										<code className="text-xs bg-muted px-1 py-0.5 rounded">
											{provider.slug}
										</code>
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{provider.emails.length > 0
											? provider.emails.map((e) => e.email).join(", ")
											: "—"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
				<DataPagination
					page={page}
					totalPages={totalPages}
					total={filteredAndSorted.length}
					pageSize={pageSize}
					itemLabel="πάροχοι"
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
				/>
			</div>

			{/* Collapsible filter sidebar */}
			<div className="flex items-stretch shrink-0">
				{/* Toggle tab */}
				<button
					type="button"
					onClick={() => setFiltersOpen(!filtersOpen)}
					className="flex flex-col items-center justify-center gap-1 w-8 bg-[#333333] text-[#f9cf44] rounded-l-md hover:bg-[#3d3d3d] transition-colors cursor-pointer"
				>
					{filtersOpen ? <FaTimes size={13} /> : <FaSlidersH size={13} />}
					{!filtersOpen && activeFilterCount > 0 && (
						<span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#f9cf44] text-[#333333] text-[9px] font-bold">
							{activeFilterCount}
						</span>
					)}
				</button>

				{/* Filter panel */}
				{filtersOpen && (
					<div className="w-72 flex flex-col p-4 space-y-4 bg-[#333333] text-[#f9cf44] rounded-r-md overflow-y-auto">
						<div className="space-y-1">
							<Input
								className="h-8 w-full bg-white text-[#333333]"
								id="filterName"
								onChange={(e) => setSearchName(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
								placeholder="Όνομα παρόχου"
								value={searchName}
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor="filterSlug" className="text-xs">
								Slug
							</Label>
							<Input
								id="filterSlug"
								placeholder="Αναζήτηση…"
								value={searchSlug}
								onChange={(e) => setSearchSlug(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
								className="h-8 w-full bg-white text-[#333333]"
							/>
						</div>

						<div className="flex flex-col gap-2 pt-1 mt-auto">
							<Button
								size="sm"
								onClick={handleApply}
								className="hover:bg-[#333] hover:ring-2 hover:ring-[#f9cf44]"
							>
								Εφαρμογή
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={handleReset}
								className="bg-white text-[#333333] border-[#333333] hover:bg-[#333] hover:ring-2 hover:ring-[#f9cf44] hover:text-[#f9cf44]"
							>
								Καθαρισμός
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
