"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
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
import { type Partner } from "./partner-sheet";

type PartnersClientProps = {
	partners: Partner[];
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

export default function PartnersClient({
	partners: initialPartners,
}: PartnersClientProps) {
	const router = useRouter();
	const [sortCol, setSortCol] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);

	// Filter state
	const [searchName, setSearchName] = useState("");
	const [searchEmail, setSearchEmail] = useState("");
	const [searchPhone, setSearchPhone] = useState("");

	// Applied filters
	const [applied, setApplied] = useState({ name: "", email: "", phone: "" });

	function handleApply() {
		setPage(1);
		setApplied({ name: searchName, email: searchEmail, phone: searchPhone });
	}

	function handleReset() {
		setSearchName("");
		setSearchEmail("");
		setSearchPhone("");
		setPage(1);
		setApplied({ name: "", email: "", phone: "" });
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
		let list = initialPartners;

		if (applied.name)
			list = list.filter((p) =>
				p.name.toLowerCase().includes(applied.name.toLowerCase()),
			);
		if (applied.email)
			list = list.filter((p) =>
				(p.email ?? "").toLowerCase().includes(applied.email.toLowerCase()),
			);
		if (applied.phone)
			list = list.filter((p) =>
				(p.phone ?? "").includes(applied.phone),
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
				case "email":
					aVal = a.email ?? "";
					bVal = b.email ?? "";
					break;
				case "phone":
					aVal = a.phone ?? "";
					bVal = b.phone ?? "";
					break;
			}
			if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
			return 0;
		});
	}, [initialPartners, applied, sortCol, sortDir]);

	const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
	const paginatedPartners = filteredAndSorted.slice(
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
						<Link href="/partners/new" className={buttonVariants()}>
							Νέος Συνεργάτης
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
											Επωνυμία
											<SortIcon col="name" sortCol={sortCol} sortDir={sortDir} />
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
										onClick={() => handleSort("phone")}
									>
										<div className="flex items-center gap-1">
											Τηλέφωνο
											<SortIcon col="phone" sortCol={sortCol} sortDir={sortDir} />
										</div>
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
											Δεν βρέθηκαν συνεργάτες
										</TableCell>
									</TableRow>
								)}
								{paginatedPartners.map((partner) => (
									<TableRow
										key={partner.id}
										className="cursor-pointer hover:bg-muted/50"
										onClick={() => router.push(`/partners/${partner.id}`)}
									>
										<TableCell className="font-mono text-sm">{partner.id}</TableCell>
										<TableCell className="font-medium">{partner.name}</TableCell>
										<TableCell>{partner.email ?? "—"}</TableCell>
										<TableCell>{partner.phone ?? "—"}</TableCell>
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
						itemLabel="συνεργάτες"
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
								placeholder="Επωνυμία συνεργάτη"
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
