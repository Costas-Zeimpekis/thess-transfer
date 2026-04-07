"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
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

	// Filter state
	const [searchName, setSearchName] = useState("");
	const [searchEmail, setSearchEmail] = useState("");
	const [searchPhone, setSearchPhone] = useState("");
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

	// Applied filters
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

	const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
	const paginatedDrivers = filteredAndSorted.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	return (
		<>
			<div className="flex gap-6 items-stretch h-full">
				{/* Table */}
				<div className="flex-1 min-w-0 bg-white p-4 flex flex-col h-full">
					<div className="flex items-center gap-3 mb-6">
						<Navigation />
						<div className="flex-1" />
						<Link href="/drivers/new" className={buttonVariants()}>
							Νέος Οδηγός
						</Link>
					</div>
					<div className="rounded-md border overflow-auto" style={{ height: "100%" }}>
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/50 border-t-[#f9cf44] border-t-4">
									<TableHead
										className="font-extrabold  overflow-hidden p-0 cursor-pointer select-none w-[22px]"
										onClick={() => handleSort("id")}
									>
										<div
											className="flex items-center justify-start h-full px-4 py-3 bg-[#f9cf44] text-[#333333]"
											style={{ paddingLeft: 10 }}
										>
											<div className="flex items-center gap-1">
												#
												<SortIcon
													col="id"
													sortCol={sortCol}
													sortDir={sortDir}
												/>
											</div>
										</div>
									</TableHead>
									<TableHead
										className="font-extrabold cursor-pointer select-none"
										onClick={() => handleSort("fullName")}
									>
										<div className="flex items-center gap-1">
											Ονοματεπώνυμο
											<SortIcon col="fullName" sortCol={sortCol} sortDir={sortDir} />
										</div>
									</TableHead>
									<TableHead
										className="font-extrabold cursor-pointer select-none"
										onClick={() => handleSort("phone")}
									>
										<div className="flex items-center gap-1">
											Τηλέφωνο
											<SortIcon col="phone" sortCol={sortCol} sortDir={sortDir} />
										</div>
									</TableHead>
									<TableHead
										className="font-extrabold cursor-pointer select-none"
										onClick={() => handleSort("email")}
									>
										<div className="flex items-center gap-1">
											Email
											<SortIcon col="email" sortCol={sortCol} sortDir={sortDir} />
										</div>
									</TableHead>
									<TableHead
										className="font-extrabold cursor-pointer select-none"
										onClick={() => handleSort("active")}
									>
										<div className="flex items-center gap-1">
											Κατάσταση
											<SortIcon col="active" sortCol={sortCol} sortDir={sortDir} />
										</div>
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredAndSorted.length === 0 && (
									<TableRow>
										<TableCell
											colSpan={5}
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
        								<TableCell className="font-medium">{driver.fullName}</TableCell>
										<TableCell>{driver.phone ?? "—"}</TableCell>
										<TableCell>{driver.email ?? "—"}</TableCell>
										<TableCell>
											{driver.active ? (
												<Badge variant="default">Ενεργός</Badge>
											) : (
												<Badge variant="secondary">Ανενεργός</Badge>
											)}
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
						itemLabel="οδηγοί"
						onPageChange={setPage}
						onPageSizeChange={setPageSize}
					/>
				</div>

				{/* Filter sidebar */}
				<aside className="w-80 shrink-0 flex flex-col">
					<div className="flex flex-col flex-1 rounded-md border p-4 space-y-4 bg-[#333333] text-[#f9cf44]">
						<div className="space-y-1">
							<Input
								className="h-8 w-full bg-white text-[#333333] mb-6"
								id="filterName"
								onChange={(e) => setSearchName(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
								placeholder="'Ονομα οδηγού "
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
				</aside>
			</div>
		</>
	);
}
