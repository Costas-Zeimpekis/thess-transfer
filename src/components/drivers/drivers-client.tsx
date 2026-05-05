"use client";

import React from "react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSort, FaSortDown, FaSortUp, FaSlidersH, FaTimes } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
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
import { type Driver } from "./driver-sheet";
import {
	DEFAULT_DRIVER_COLUMNS,
	loadDriverColumns,
	type DriverColumn,
} from "@/lib/driver-columns";

type DriversClientProps = {
	drivers: Driver[];
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

export default function DriversClient({
	drivers: initialDrivers,
}: DriversClientProps) {
	const router = useRouter();
	const [sortCol, setSortCol] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [filtersOpen, setFiltersOpen] = useState(false);

	const [searchName, setSearchName] = useState("");
	const [searchEmail, setSearchEmail] = useState("");
	const [searchPhone, setSearchPhone] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
	const [columnConfig, setColumnConfig] = useState<DriverColumn[]>(DEFAULT_DRIVER_COLUMNS);

	useEffect(() => { setColumnConfig(loadDriverColumns()); }, []);

	const [applied, setApplied] = useState({
		name: "",
		email: "",
		phone: "",
		status: "all" as "all" | "active" | "inactive",
	});

	function handleApply() {
		setPage(1);
		setApplied({ name: searchName, email: searchEmail, phone: searchPhone, status: statusFilter });
	}

	function handleReset() {
		setSearchName("");
		setSearchEmail("");
		setSearchPhone("");
		setStatusFilter("all");
		setPage(1);
		setApplied({ name: "", email: "", phone: "", status: "all" });
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
		let list = initialDrivers;

		if (applied.name)
			list = list.filter((d) =>
				d.fullName.toLowerCase().includes(applied.name.toLowerCase()),
			);
		if (applied.email)
			list = list.filter((d) =>
				(d.email ?? "").toLowerCase().includes(applied.email.toLowerCase()),
			);
		if (applied.phone)
			list = list.filter((d) =>
				(d.phone ?? "").includes(applied.phone),
			);
		if (applied.status === "active")
			list = list.filter((d) => d.active);
		else if (applied.status === "inactive")
			list = list.filter((d) => !d.active);

		if (!sortCol) return list;
		return [...list].sort((a, b) => {
			let aVal: string | number = "";
			let bVal: string | number = "";
			switch (sortCol) {
				case "id":
					aVal = a.id;
					bVal = b.id;
					break;
				case "fullName":
					aVal = a.fullName;
					bVal = b.fullName;
					break;
				case "phone":
					aVal = a.phone ?? "";
					bVal = b.phone ?? "";
					break;
				case "email":
					aVal = a.email ?? "";
					bVal = b.email ?? "";
					break;
				case "active":
					aVal = a.active ? 1 : 0;
					bVal = b.active ? 1 : 0;
					break;
			}
			if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
			return 0;
		});
	}, [initialDrivers, applied, sortCol, sortDir]);

	const visibleCols = columnConfig.filter((c) => c.visible);

	const colDefs: Record<string, {
		head: React.ReactNode;
		cell: (d: Driver) => React.ReactNode;
	}> = {
		fullName: {
			head: <div className="flex items-center gap-1">Ονοματεπώνυμο<SortIcon col="fullName" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (d) => <TableCell key="fullName" className="font-medium">{d.fullName}</TableCell>,
		},
		driversLicense: {
			head: "Δίπλωμα Οδήγησης",
			cell: (d) => <TableCell key="driversLicense">{d.driversLicense ?? "—"}</TableCell>,
		},
		taxId: {
			head: "ΑΦΜ",
			cell: (d) => <TableCell key="taxId">{d.taxId ?? "—"}</TableCell>,
		},
		phone: {
			head: <div className="flex items-center gap-1">Τηλέφωνο<SortIcon col="phone" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (d) => <TableCell key="phone">{d.phone ?? "—"}</TableCell>,
		},
		email: {
			head: <div className="flex items-center gap-1">Email<SortIcon col="email" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (d) => <TableCell key="email">{d.email ?? "—"}</TableCell>,
		},
		active: {
			head: <div className="flex items-center gap-1">Κατάσταση<SortIcon col="active" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (d) => (
				<TableCell key="active">
					{d.active ? <Badge variant="default">Ενεργός</Badge> : <Badge variant="secondary">Ανενεργός</Badge>}
				</TableCell>
			),
		},
	};

	const sortableKeys = new Set(["fullName", "phone", "email", "active"]);

	const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
	const paginatedDrivers = filteredAndSorted.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	const activeFilterCount = [
		applied.name !== "",
		applied.email !== "",
		applied.phone !== "",
		applied.status !== "all",
	].filter(Boolean).length;

	return (
		<div className="flex gap-2 items-stretch flex-1 min-h-0">
			{/* Main content */}
			<div className="flex-1 min-w-0 bg-white p-4 flex flex-col min-h-0">
				<div className="flex items-center gap-3 mb-6">
					<Navigation />
					<div className="flex-1" />
					<Link href="/drivers/new" className={buttonVariants()}>
						Νέος Οδηγός
					</Link>
				</div>
				<div className="rounded-md border border-t-4 border-t-[#f9cf44] overflow-x-scroll overflow-y-scroll flex-1 min-h-0">
					<div className="min-w-max">
					<Table>
						<TableHeader className="sticky top-0 z-10 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-muted">
							<TableRow className="bg-muted">
								<TableHead
									className="font-extrabold overflow-hidden p-0 cursor-pointer select-none w-5.5"
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
								{visibleCols.map((col) => (
									<TableHead
										key={col.key}
										className={`font-extrabold${sortableKeys.has(col.key) ? " cursor-pointer select-none" : ""}`}
										onClick={sortableKeys.has(col.key) ? () => handleSort(col.key) : undefined}
									>
										{colDefs[col.key]?.head}
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredAndSorted.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={1 + visibleCols.length}
										className="text-center text-muted-foreground py-8"
									>
										Δεν βρέθηκαν οδηγοί
									</TableCell>
								</TableRow>
							)}
							{paginatedDrivers.map((driver) => (
								<TableRow
									key={driver.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => router.push(`/drivers/${driver.id}`)}
								>
									<TableCell className="font-mono text-sm">{driver.id}</TableCell>
									{visibleCols.map((col) => (
										<React.Fragment key={col.key}>
											{colDefs[col.key]?.cell(driver)}
										</React.Fragment>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
					</div>
				</div>
				<DataPagination
					page={page}
					totalPages={totalPages}
					total={filteredAndSorted.length}
					pageSize={pageSize}
					itemLabel="οδηγοί"
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
								placeholder="Όνομα οδηγού"
								value={searchName}
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor="filterEmail" className="text-xs">
								Email
							</Label>
							<Input
								id="filterEmail"
								placeholder="Αναζήτηση…"
								value={searchEmail}
								onChange={(e) => setSearchEmail(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
								className="h-8 w-full bg-white text-[#333333]"
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor="filterPhone" className="text-xs">
								Τηλέφωνο
							</Label>
							<Input
								id="filterPhone"
								placeholder="Αναζήτηση…"
								value={searchPhone}
								onChange={(e) => setSearchPhone(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
								className="h-8 w-full bg-white text-[#333333]"
							/>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Κατάσταση</Label>
							<div className="flex rounded-md overflow-hidden border border-[#f9cf44]">
								{(["all", "active", "inactive"] as const).map((opt) => {
									const labels = { all: "Όλοι", active: "Ενεργοί", inactive: "Ανενεργοί" };
									return (
										<button
											key={opt}
											type="button"
											onClick={() => setStatusFilter(opt)}
											className={`flex-1 py-1 text-xs font-medium transition-colors ${
												statusFilter === opt
													? "bg-[#f9cf44] text-[#333333]"
													: "text-[#f9cf44] hover:bg-[#f9cf44]/20"
											}`}
										>
											{labels[opt]}
										</button>
									);
								})}
							</div>
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
