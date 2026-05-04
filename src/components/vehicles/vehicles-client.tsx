"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaSort, FaSortDown, FaSortUp, FaSlidersH, FaTimes } from "react-icons/fa";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import DataPagination from "@/components/ui/data-pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Navigation from "../ui/navigation";
import { type Vehicle } from "./vehicle-sheet";

const vehicleTypeLabels: Record<string, string> = {
	car: "Επιβατικό",
	van: "Βανάκι",
	bus: "Λεωφορείο",
};

type VehiclesClientProps = {
	vehicles: Vehicle[];
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

export default function VehiclesClient({
	vehicles: initialVehicles,
}: VehiclesClientProps) {
	const router = useRouter();
	const [sortCol, setSortCol] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [filtersOpen, setFiltersOpen] = useState(false);

	const [searchName, setSearchName] = useState("");
	const [searchPlate, setSearchPlate] = useState("");
	const [typeFilter, setTypeFilter] = useState<"all" | "car" | "van" | "bus">("all");
	const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

	const [applied, setApplied] = useState({
		name: "",
		plate: "",
		type: "all" as "all" | "car" | "van" | "bus",
		status: "all" as "all" | "active" | "inactive",
	});

	function handleApply() {
		setPage(1);
		setApplied({ name: searchName, plate: searchPlate, type: typeFilter, status: statusFilter });
	}

	function handleReset() {
		setSearchName("");
		setSearchPlate("");
		setTypeFilter("all");
		setStatusFilter("all");
		setPage(1);
		setApplied({ name: "", plate: "", type: "all", status: "all" });
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
		let list = initialVehicles;

		if (applied.name)
			list = list.filter((v) =>
				v.name.toLowerCase().includes(applied.name.toLowerCase()),
			);
		if (applied.plate)
			list = list.filter((v) =>
				v.plate.toLowerCase().includes(applied.plate.toLowerCase()),
			);
		if (applied.type !== "all")
			list = list.filter((v) => v.type === applied.type);
		if (applied.status === "active")
			list = list.filter((v) => v.active);
		else if (applied.status === "inactive")
			list = list.filter((v) => !v.active);

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
				case "plate":
					aVal = a.plate;
					bVal = b.plate;
					break;
				case "type":
					aVal = vehicleTypeLabels[a.type] ?? a.type;
					bVal = vehicleTypeLabels[b.type] ?? b.type;
					break;
				case "brand":
					aVal = a.brand ?? "";
					bVal = b.brand ?? "";
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
	}, [initialVehicles, applied, sortCol, sortDir]);

	const totalPages = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
	const paginatedVehicles = filteredAndSorted.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	const activeFilterCount = [
		applied.name !== "",
		applied.plate !== "",
		applied.type !== "all",
		applied.status !== "all",
	].filter(Boolean).length;

	return (
		<div className="flex gap-2 items-stretch flex-1 min-h-0">
			{/* Main content */}
			<div className="flex-1 min-w-0 bg-white p-4 flex flex-col min-h-0">
				<div className="flex items-center gap-3 mb-6">
					<Navigation />
					<div className="flex-1" />
					<Link href="/vehicles/new" className={buttonVariants()}>
						Νέο Όχημα
					</Link>
				</div>
				<div className="rounded-md border border-t-4 border-t-[#f9cf44] overflow-x-scroll overflow-y-scroll flex-1 min-h-0">
					<div className="min-w-max">
					<Table>
						<TableHeader className="sticky top-0 z-10 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-muted">
							<TableRow className="bg-muted">
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
									onClick={() => handleSort("plate")}
								>
									<div className="flex items-center gap-1">
										Πινακίδα
										<SortIcon col="plate" sortCol={sortCol} sortDir={sortDir} />
									</div>
								</TableHead>
								<TableHead
									className="font-extrabold cursor-pointer select-none"
									onClick={() => handleSort("type")}
								>
									<div className="flex items-center gap-1">
										Τύπος
										<SortIcon col="type" sortCol={sortCol} sortDir={sortDir} />
									</div>
								</TableHead>
								<TableHead
									className="font-extrabold cursor-pointer select-none"
									onClick={() => handleSort("brand")}
								>
									<div className="flex items-center gap-1">
										Μάρκα
										<SortIcon col="brand" sortCol={sortCol} sortDir={sortDir} />
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
										colSpan={6}
										className="text-center text-muted-foreground py-8"
									>
										Δεν βρέθηκαν οχήματα
									</TableCell>
								</TableRow>
							)}
							{paginatedVehicles.map((vehicle) => (
								<TableRow
									key={vehicle.id}
									className="cursor-pointer hover:bg-muted/50"
									onClick={() => router.push(`/vehicles/${vehicle.id}`)}
								>
									<TableCell className="font-mono text-sm">{vehicle.id}</TableCell>
									<TableCell className="font-medium">{vehicle.name}</TableCell>
									<TableCell>{vehicle.plate}</TableCell>
									<TableCell>
										<Badge variant="outline">
											{vehicleTypeLabels[vehicle.type] ?? vehicle.type}
										</Badge>
									</TableCell>
									<TableCell>{vehicle.brand ?? "—"}</TableCell>
									<TableCell>
										{vehicle.active ? (
											<Badge variant="default">Ενεργό</Badge>
										) : (
											<Badge variant="secondary">Ανενεργό</Badge>
										)}
									</TableCell>
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
					itemLabel="οχήματα"
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
								placeholder="Όνομα οχήματος"
								value={searchName}
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor="filterPlate" className="text-xs">
								Πινακίδα
							</Label>
							<Input
								id="filterPlate"
								placeholder="Αναζήτηση…"
								value={searchPlate}
								onChange={(e) => setSearchPlate(e.target.value)}
								onKeyDown={(e) => { if (e.key === "Enter") handleApply(); }}
								className="h-8 w-full bg-white text-[#333333]"
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor="filterType" className="text-xs">
								Τύπος
							</Label>
							<Select
								value={typeFilter}
								onValueChange={(v) => setTypeFilter(v as "all" | "car" | "van" | "bus")}
							>
								<SelectTrigger id="filterType" className="h-8 bg-white text-[#333333]">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Όλοι</SelectItem>
									<SelectItem value="car">Επιβατικό</SelectItem>
									<SelectItem value="van">Βανάκι</SelectItem>
									<SelectItem value="bus">Λεωφορείο</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Κατάσταση</Label>
							<div className="flex rounded-md overflow-hidden border border-[#f9cf44]">
								{(["all", "active", "inactive"] as const).map((opt) => {
									const labels = { all: "Όλα", active: "Ενεργά", inactive: "Ανενεργά" };
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
