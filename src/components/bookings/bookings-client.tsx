"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSort, FaSortDown, FaSortUp, FaSlidersH, FaTimes } from "react-icons/fa";
import { Download } from "lucide-react";
import * as XLSX from "xlsx";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Navigation from "../ui/navigation";
import {
	DEFAULT_BOOKING_COLUMNS,
	loadBookingColumns,
	type BookingColumn,
} from "@/lib/booking-columns";

type Provider = { id: number; name: string; slug: string };
type Driver = { id: number; fullName: string };
type Vehicle = { id: number; name: string; plate: string };
type Partner = { id: number; name: string };

export type BookingRow = {
	id: number;
	providerBookingRef: string;
	providerId: number;
	providerName: string;
	status: "pending" | "confirmed" | "completed" | "cancelled";
	source: string;
	pickupDatetime: string;
	flightNumber: string | null;
	pickupLocation: string;
	dropoffLocation: string;
	passengerCount: number;
	vehicleType: "car" | "van" | "bus";
	babySeat: boolean | null;
	boosterSeat: boolean | null;
	customerName: string;
	customerPhone: string | null;
	customerEmail: string | null;
	paymentMethod: string | null;
	notes: string | null;
	realPrice: string | null;
	declaredPrice: string | null;
	driverId: number | null;
	driverName: string | null;
	vehicleId: number | null;
	vehicleName: string | null;
	vehiclePlate: string | null;
	partnerId: number | null;
	partnerName: string | null;
	partnerAssignmentPrice: string | null;
	linkedBookingId: number | null;
	isReturnTrip: boolean | null;
	createdAt: string;
	updatedAt: string;
};

type Totals = {
	realPrice: string;
	declaredPrice: string;
	difference: string;
};

type BookingsClientProps = {
	providers: Provider[];
	drivers: Driver[];
	vehicles: Vehicle[];
	partners: Partner[];
};

const STATUS_LABELS: Record<string, string> = {
	pending: "Εκκρεμείς",
	confirmed: "Επιβεβαιωμένες",
	completed: "Ολοκληρωμένες",
	cancelled: "Ακυρωμένες",
};

const VEHICLE_TYPE_LABELS: Record<string, string> = {
	car: "Επιβατικό",
	van: "Βανάκι",
	bus: "Λεωφορείο",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	cash: "Μετρητά",
	paypal: "PayPal",
	credit_card: "Πιστωτική Κάρτα",
	bank: "Τράπεζα",
	paid: "Πληρωμένο",
};

function statusBadgeClass(status: string): string {
	switch (status) {
		case "pending":
			return "border-amber-400 text-amber-700 bg-amber-50";
		case "confirmed":
			return "bg-blue-100 text-blue-800 border-blue-200";
		case "completed":
			return "bg-green-100 text-green-800 border-green-200";
		case "cancelled":
			return "bg-red-100 text-red-800 border-red-200";
		default:
			return "";
	}
}

function fmt(val: string | null): string {
	if (val == null) return "—";
	return `€${parseFloat(val).toFixed(2)}`;
}

function diffClass(val: number): string {
	return val < 0 ? "text-red-600 font-medium" : "";
}

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

export default function BookingsClient({
	providers,
	drivers,
	vehicles,
	partners,
}: BookingsClientProps) {
	const router = useRouter();
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [status, setStatus] = useState("all");
	const [bookingSource, setBookingSource] = useState<
		"all" | "own" | "provider"
	>("all");
	const [providerId, setProviderId] = useState("all");
	const [driverId, setDriverId] = useState("all");
	const [vehicleId, setVehicleId] = useState("all");
	const [partnerId, setPartnerId] = useState("all");
	const [paymentMethod, setPaymentMethod] = useState("all");
	const [search, setSearch] = useState("");
	const [assignmentTab, setAssignmentTab] = useState<"driver" | "partner">(
		"driver",
	);

	const [applied, setApplied] = useState({
		from: "",
		to: "",
		status: "all",
		bookingSource: "all" as "all" | "own" | "provider",
		providerId: "all",
		driverId: "all",
		vehicleId: "all",
		partnerId: "all",
		paymentMethod: "all",
		search: "",
	});

	const [bookingsList, setBookingsList] = useState<BookingRow[]>([]);
	const [totals, setTotals] = useState<Totals>({
		realPrice: "0.00",
		declaredPrice: "0.00",
		difference: "0.00",
	});
	const [loading, setLoading] = useState(false);
	const [sortCol, setSortCol] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [columnConfig, setColumnConfig] = useState<BookingColumn[]>(DEFAULT_BOOKING_COLUMNS);

	useEffect(() => {
		setColumnConfig(loadBookingColumns());
	}, []);

	function handleSort(col: string) {
		setPage(1);
		if (sortCol === col) {
			setSortDir(sortDir === "asc" ? "desc" : "asc");
		} else {
			setSortCol(col);
			setSortDir("asc");
		}
	}

	const sortedList = useMemo(() => {
		if (!sortCol) return bookingsList;
		return [...bookingsList].sort((a, b) => {
			let aVal: string | number = "";
			let bVal: string | number = "";
			switch (sortCol) {
				case "id":
					aVal = a.id;
					bVal = b.id;
					break;
				case "providerBookingRef":
					aVal = a.providerBookingRef;
					bVal = b.providerBookingRef;
					break;
				case "providerName":
					aVal = a.providerName;
					bVal = b.providerName;
					break;
				case "pickupDatetime":
					aVal = a.pickupDatetime;
					bVal = b.pickupDatetime;
					break;
				case "customerName":
					aVal = a.customerName;
					bVal = b.customerName;
					break;
				case "vehicleType":
					aVal = a.vehicleType;
					bVal = b.vehicleType;
					break;
				case "assignment":
					aVal = a.driverName ?? a.partnerName ?? "";
					bVal = b.driverName ?? b.partnerName ?? "";
					break;
				case "vehicleName":
					aVal = a.vehicleName ?? "";
					bVal = b.vehicleName ?? "";
					break;
				case "status":
					aVal = a.status;
					bVal = b.status;
					break;
				case "createdAt":
					aVal = a.createdAt;
					bVal = b.createdAt;
					break;
			}
			if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
			if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
			return 0;
		});
	}, [bookingsList, sortCol, sortDir]);

	const totalPages = Math.max(1, Math.ceil(sortedList.length / pageSize));
	const paginatedList = sortedList.slice(
		(page - 1) * pageSize,
		page * pageSize,
	);

	const fetchBookings = useCallback(async (filters: typeof applied) => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (filters.status !== "all") params.set("status", filters.status);
			if (filters.bookingSource === "own") params.set("source", "manual");
			else if (filters.bookingSource === "provider")
				params.set("source", "automatic");
			if (filters.providerId !== "all")
				params.set("provider", filters.providerId);
			if (filters.driverId !== "all") params.set("driver", filters.driverId);
			if (filters.vehicleId !== "all") params.set("vehicle", filters.vehicleId);
			if (filters.partnerId !== "all") params.set("partner", filters.partnerId);
			if (filters.paymentMethod !== "all") params.set("paymentMethod", filters.paymentMethod);
			if (filters.from) params.set("from", filters.from);
			if (filters.to) params.set("to", filters.to);
			if (filters.search) params.set("search", filters.search);
			const res = await fetch(`/api/bookings?${params.toString()}`);
			if (res.ok) {
				const data = await res.json();
				setBookingsList(data.bookings);
				setTotals(data.totals);
			}
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchBookings(applied);
	}, [applied, fetchBookings]);

	function handleApply() {
		setPage(1);
		setApplied({
			from,
			to,
			status,
			bookingSource,
			providerId,
			driverId,
			vehicleId,
			partnerId,
			paymentMethod,
			search,
		});
	}

	function handleReset() {
		setPage(1);
		setFrom("");
		setTo("");
		setStatus("all");
		setBookingSource("all");
		setProviderId("all");
		setDriverId("all");
		setVehicleId("all");
		setPartnerId("all");
		setPaymentMethod("all");
		setSearch("");
		setAssignmentTab("driver");
		setApplied({
			from: "",
			to: "",
			status: "all",
			bookingSource: "all" as "all" | "own" | "provider",
			providerId: "all",
			driverId: "all",
			vehicleId: "all",
			partnerId: "all",
			paymentMethod: "all",
			search: "",
		});
	}

	function handleExport() {
		const now = new Date();
		const pad = (n: number) => String(n).padStart(2, "0");
		const filename = `bookings-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}.xlsx`;
		const rows = sortedList.map((b) => ({
			"#": b.id,
			"Ref Παρόχου": b.providerBookingRef,
			"Πάροχος": b.providerName,
			"Ημ/νία Κράτησης": new Date(b.createdAt).toLocaleString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }),
			"Ημ/νία Παραλαβής": new Date(b.pickupDatetime).toLocaleString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }),
			"Πελάτης": b.customerName,
			"Τηλέφωνο": b.customerPhone ?? "",
			"Email": b.customerEmail ?? "",
			"Κατάσταση": STATUS_LABELS[b.status] ?? b.status,
			"Ανάθεση": b.driverName ?? b.partnerName ?? "",
			"Τύπος Οχήματος": b.partnerId != null ? "" : (VEHICLE_TYPE_LABELS[b.vehicleType] ?? b.vehicleType),
			"Όχημα": b.partnerId != null ? "" : (b.vehicleName ? `${b.vehicleName} (${b.vehiclePlate})` : ""),
			"Τρόπος Πληρωμής": b.paymentMethod ? (PAYMENT_METHOD_LABELS[b.paymentMethod] ?? b.paymentMethod) : "",
			"Πραγματική Τιμή (€)": b.realPrice != null ? parseFloat(b.realPrice) : "",
			"Δηλωθείσα Τιμή (€)": b.declaredPrice != null ? parseFloat(b.declaredPrice) : "",
			"Σημειώσεις": b.notes ?? "",
		}));
		const ws = XLSX.utils.json_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Κρατήσεις");
		XLSX.writeFile(wb, filename);
	}

	const totalDiff = parseFloat(totals.difference);

	const visibleCols = columnConfig.filter((c) => c.visible);
	const colCount = 1 + visibleCols.length;

	const colDefs: Record<string, {
		headClass: string;
		onClick?: () => void;
		head: React.ReactNode;
		cell: (b: BookingRow) => React.ReactNode;
		skeleton: React.ReactNode;
	}> = {
		createdAt: {
			headClass: "font-extrabold cursor-pointer select-none",
			onClick: () => handleSort("createdAt"),
			head: <div className="flex items-center gap-1">Ημ/νία Κράτησης<SortIcon col="createdAt" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (b) => <TableCell className="whitespace-nowrap text-sm">{new Date(b.createdAt).toLocaleString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</TableCell>,
			skeleton: <TableCell><Skeleton className="h-4 w-32" /></TableCell>,
		},
		providerName: {
			headClass: "font-extrabold cursor-pointer select-none",
			onClick: () => handleSort("providerName"),
			head: <div className="flex items-center gap-1">Πάροχος<SortIcon col="providerName" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (b) => <TableCell>{b.providerName}</TableCell>,
			skeleton: <TableCell><Skeleton className="h-4 w-24" /></TableCell>,
		},
		providerBookingRef: {
			headClass: "font-extrabold cursor-pointer select-none",
			onClick: () => handleSort("providerBookingRef"),
			head: <div className="flex items-center gap-1">Ref Παρόχου<SortIcon col="providerBookingRef" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (b) => <TableCell className="font-mono text-sm">{b.providerBookingRef}</TableCell>,
			skeleton: <TableCell><Skeleton className="h-4 w-20" /></TableCell>,
		},
		pickupDatetime: {
			headClass: "font-extrabold cursor-pointer select-none",
			onClick: () => handleSort("pickupDatetime"),
			head: <div className="flex items-center gap-1">Ημ/νία Παραλαβής<SortIcon col="pickupDatetime" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (b) => <TableCell className="whitespace-nowrap">{new Date(b.pickupDatetime).toLocaleString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })}</TableCell>,
			skeleton: <TableCell><Skeleton className="h-4 w-32" /></TableCell>,
		},
		assignment: {
			headClass: "font-extrabold cursor-pointer select-none",
			onClick: () => handleSort("assignment"),
			head: <div className="flex items-center gap-1">Ανάθεση<SortIcon col="assignment" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (b) => <TableCell className="text-sm">{b.driverName ?? b.partnerName ?? "—"}</TableCell>,
			skeleton: <TableCell><Skeleton className="h-4 w-28" /></TableCell>,
		},
		vehicleType: {
			headClass: "font-extrabold cursor-pointer select-none",
			onClick: () => handleSort("vehicleType"),
			head: <div className="flex items-center gap-1">Τύπος Οχήματος<SortIcon col="vehicleType" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (b) => (
				<TableCell>
					{b.partnerId != null ? "—" : (
						<Badge variant="outline" className="text-xs">{VEHICLE_TYPE_LABELS[b.vehicleType] ?? b.vehicleType}</Badge>
					)}
				</TableCell>
			),
			skeleton: <TableCell><Skeleton className="h-4 w-16" /></TableCell>,
		},
		vehicleName: {
			headClass: "font-extrabold cursor-pointer select-none",
			onClick: () => handleSort("vehicleName"),
			head: <div className="flex items-center gap-1">Όχημα<SortIcon col="vehicleName" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (b) => <TableCell className="text-sm">{b.partnerId != null ? "—" : (b.vehicleName ? `${b.vehicleName} (${b.vehiclePlate})` : "—")}</TableCell>,
			skeleton: <TableCell><Skeleton className="h-4 w-24" /></TableCell>,
		},
		customerName: {
			headClass: "font-extrabold cursor-pointer select-none",
			onClick: () => handleSort("customerName"),
			head: <div className="flex items-center gap-1">Πελάτης<SortIcon col="customerName" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (b) => <TableCell>{b.customerName}</TableCell>,
			skeleton: <TableCell><Skeleton className="h-4 w-28" /></TableCell>,
		},
		status: {
			headClass: "font-extrabold cursor-pointer select-none",
			onClick: () => handleSort("status"),
			head: <div className="flex items-center gap-1">Κατάσταση<SortIcon col="status" sortCol={sortCol} sortDir={sortDir} /></div>,
			cell: (b) => (
				<TableCell>
					<Badge variant="outline" className={statusBadgeClass(b.status)}>{STATUS_LABELS[b.status] ?? b.status}</Badge>
				</TableCell>
			),
			skeleton: <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>,
		},
		paymentMethod: {
			headClass: "font-extrabold",
			head: <>Τρόπος Πληρωμής</>,
			cell: (b) => <TableCell className="text-sm">{b.paymentMethod ? (PAYMENT_METHOD_LABELS[b.paymentMethod] ?? b.paymentMethod) : "—"}</TableCell>,
			skeleton: <TableCell><Skeleton className="h-4 w-24" /></TableCell>,
		},
		realPrice: {
			headClass: "text-right font-extrabold",
			head: <>Πραγματική</>,
			cell: (b) => <TableCell className="text-right font-mono text-sm">{fmt(b.realPrice)}</TableCell>,
			skeleton: <TableCell className="text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableCell>,
		},
		declaredPrice: {
			headClass: "text-right font-extrabold",
			head: <>Δηλωθείσα</>,
			cell: (b) => <TableCell className="text-right font-mono text-sm">{fmt(b.declaredPrice)}</TableCell>,
			skeleton: <TableCell className="text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableCell>,
		},
		priceDiff: {
			headClass: "text-right font-extrabold",
			head: <>Διαφορά</>,
			cell: (b) => {
				const realVal = b.realPrice != null ? parseFloat(b.realPrice) : null;
				const declVal = b.declaredPrice != null ? parseFloat(b.declaredPrice) : null;
				const diff = realVal != null && declVal != null ? realVal - declVal : null;
				return (
					<TableCell className={`text-right font-mono text-sm ${diff != null ? diffClass(diff) : ""}`}>
						{diff != null ? `€${diff.toFixed(2)}` : "—"}
					</TableCell>
				);
			},
			skeleton: <TableCell className="text-right"><Skeleton className="h-4 w-14 ml-auto" /></TableCell>,
		},
	};

	const activeFilterCount = [
		applied.from !== "",
		applied.to !== "",
		applied.status !== "all",
		applied.bookingSource !== "all",
		applied.providerId !== "all",
		applied.driverId !== "all",
		applied.vehicleId !== "all",
		applied.partnerId !== "all",
		applied.paymentMethod !== "all",
		applied.search !== "",
	].filter(Boolean).length;

	return (
		<div className="flex gap-2 items-stretch flex-1 min-h-0">
			{/* Main content */}
			<div className="flex-1 min-w-0 bg-white p-4 flex flex-col min-h-0">
				<div className="flex items-center gap-3 mb-6 ">
					<Navigation />
					<div className="flex-1 gap-2" />

					<Link href="/bookings/new" className={buttonVariants()}>
						Νέα Κράτηση
					</Link>
					<Button variant="outline" onClick={handleExport} disabled={sortedList.length === 0 || loading}>
						<Download size={16} />
						Εξαγωγή XLSX
					</Button>
				</div>
				<div className="rounded-md border border-t-4 border-t-[#f9cf44] overflow-x-scroll overflow-y-scroll flex-1 min-h-0">
					<div className="min-w-max">
						<Table>
							<TableHeader className="sticky top-0 z-10 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-muted">
								<TableRow className="bg-muted">
									<TableHead
										className="font-extrabold overflow-hidden p-0 cursor-pointer select-none"
										onClick={() => handleSort("id")}
									>
										<div className="flex items-center justify-start h-full px-4 py-3 bg-[#f9cf44] text-[#333333]" style={{ paddingLeft: 10 }}>
											<div className="flex items-center gap-1">
												#
												<SortIcon col="id" sortCol={sortCol} sortDir={sortDir} />
											</div>
										</div>
									</TableHead>
									{visibleCols.map((col) => {
										const def = colDefs[col.key];
										if (!def) return null;
										return (
											<TableHead key={col.key} className={def.headClass} onClick={def.onClick}>
												{def.head}
											</TableHead>
										);
									})}
								</TableRow>
							</TableHeader>
							<TableBody>
								{loading &&
									Array.from({ length: 8 }).map((_, i) => (
										<TableRow key={i}>
											<TableCell><Skeleton className="h-4 w-8" /></TableCell>
											{visibleCols.map((col) => (
												<React.Fragment key={col.key}>
													{colDefs[col.key]?.skeleton}
												</React.Fragment>
											))}
										</TableRow>
									))}
								{!loading && sortedList.length === 0 && (
									<TableRow>
										<TableCell colSpan={colCount} className="text-center text-muted-foreground py-8">
											Δεν βρέθηκαν κρατήσεις
										</TableCell>
									</TableRow>
								)}
								{!loading &&
									paginatedList.map((b) => (
										<TableRow
											key={b.id}
											className="cursor-pointer hover:bg-muted/50"
											onClick={() => router.push(`/bookings/${b.id}`)}
										>
											<TableCell className="font-mono text-sm">{b.id}</TableCell>
											{visibleCols.map((col) => (
												<React.Fragment key={col.key}>
													{colDefs[col.key]?.cell(b)}
												</React.Fragment>
											))}
										</TableRow>
									))}
							</TableBody>
						</Table>
					</div>
				</div>

				{/* Totals */}
				<div className="mt-4 flex flex-wrap justify-end gap-6 rounded-md border bg-muted/40 px-4 py-3 text-sm">
					<span>
						<span className="text-muted-foreground">
							Σύνολο Πραγματικής Τιμής:{" "}
						</span>
						<span className="font-semibold font-mono">
							€{parseFloat(totals.realPrice).toFixed(2)}
						</span>
					</span>
					<span>
						<span className="text-muted-foreground">
							Σύνολο Δηλωθείσας Τιμής:{" "}
						</span>
						<span className="font-semibold font-mono">
							€{parseFloat(totals.declaredPrice).toFixed(2)}
						</span>
					</span>
					<span>
						<span className="text-muted-foreground">Σύνολο Διαφοράς: </span>
						<span
							className={`font-semibold font-mono ${totalDiff < 0 ? "text-red-600" : ""}`}
						>
							€{totalDiff.toFixed(2)}
						</span>
					</span>
				</div>
				<DataPagination
					page={page}
					totalPages={totalPages}
					total={sortedList.length}
					pageSize={pageSize}
					itemLabel="κρατήσεις"
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
						<Input
							placeholder="Αναζήτηση ονόματος ή ref…"
							className="w-full bg-white text-[#333]"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleApply();
							}}
						/>

						<div className="space-y-1">
							<Label htmlFor="from" className="text-xs">
								Από
							</Label>
							<Input
								id="from"
								type="date"
								value={from}
								onChange={(e) => setFrom(e.target.value)}
								className="h-8 w-full bg-white text-[#333333]"
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor="to" className="text-xs">
								Έως
							</Label>
							<Input
								id="to"
								type="date"
								value={to}
								onChange={(e) => setTo(e.target.value)}
								className="h-8 w-full bg-white text-[#333333]"
							/>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Κατάσταση</Label>
							<Select
								value={status}
								onValueChange={(v) => setStatus(v ?? "all")}
							>
								<SelectTrigger className="h-8 w-full bg-white text-[#333333]">
									<SelectValue>
										{(v: string | null) =>
											v === "all"
												? "Όλες"
												: ((STATUS_LABELS as Record<string, string>)[v ?? ""] ??
													v)
										}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Όλες</SelectItem>
									<SelectItem value="pending">Εκκρεμείς</SelectItem>
									<SelectItem value="confirmed">Επιβεβαιωμένες</SelectItem>
									<SelectItem value="completed">Ολοκληρωμένες</SelectItem>
									<SelectItem value="cancelled">Ακυρωμένες</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Τρόπος Πληρωμής</Label>
							<Select
								value={paymentMethod}
								onValueChange={(v) => setPaymentMethod(v ?? "all")}
							>
								<SelectTrigger className="h-8 w-full bg-white text-[#333333]">
									<SelectValue>
										{(v: string | null) =>
											v === "all"
												? "Όλοι"
												: ((PAYMENT_METHOD_LABELS as Record<string, string>)[v ?? ""] ?? v)
										}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Όλοι</SelectItem>
									<SelectItem value="cash">Μετρητά</SelectItem>
									<SelectItem value="paypal">PayPal</SelectItem>
									<SelectItem value="credit_card">Πιστωτική Κάρτα</SelectItem>
									<SelectItem value="bank">Τράπεζα</SelectItem>
									<SelectItem value="paid">Πληρωμένο</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Τύπος Κράτησης</Label>
							<div className="flex rounded-md overflow-hidden border border-[#f9cf44]">
								{(["all", "own", "provider"] as const).map((opt) => {
									const labels = {
										all: "Όλες",
										own: "Δική μας",
										provider: "Πάροχο",
									};
									return (
										<button
											key={opt}
											type="button"
											onClick={() => {
												setBookingSource(opt);
												if (opt === "own") setProviderId("all");
											}}
											className={`flex-1 py-1 text-xs font-medium transition-colors ${bookingSource === opt
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

						<div className="space-y-1">
							<Label className="text-xs">Πάροχος</Label>
							<Select
								value={providerId}
								onValueChange={(v) => setProviderId(v ?? "all")}
								disabled={bookingSource === "own"}
							>
								<SelectTrigger className="h-8 w-full bg-white text-[#333333]">
									<SelectValue>
										{(v: string | null) =>
											v === "all"
												? "Όλοι"
												: (providers.find((p) => String(p.id) === v)?.name ?? v)
										}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Όλοι</SelectItem>
									{providers.map((p) => (
										<SelectItem key={p.id} value={String(p.id)}>
											{p.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<div className="flex rounded-md overflow-hidden border border-[#f9cf44]">
								<button
									type="button"
									onClick={() => {
										setAssignmentTab("driver");
										setPartnerId("all");
									}}
									className={`flex-1 py-1 text-xs font-medium transition-colors ${assignmentTab === "driver"
										? "bg-[#f9cf44] text-[#333333]"
										: "text-[#f9cf44] hover:bg-[#f9cf44]/20"
										}`}
								>
									Οδηγός
								</button>
								<button
									type="button"
									onClick={() => {
										setAssignmentTab("partner");
										setDriverId("all");
										setVehicleId("all");
									}}
									className={`flex-1 py-1 text-xs font-medium transition-colors ${assignmentTab === "partner"
										? "bg-[#f9cf44] text-[#333333]"
										: "text-[#f9cf44] hover:bg-[#f9cf44]/20"
										}`}
								>
									Συνεργάτης
								</button>
							</div>

							{assignmentTab === "driver" ? (
								<>
									<div className="space-y-1">
										<Label className="text-xs">Οδηγός</Label>
										<Select
											value={driverId}
											onValueChange={(v) => setDriverId(v ?? "all")}
										>
											<SelectTrigger className="h-8 w-full bg-white text-[#333333]">
												<SelectValue>
													{(v: string | null) =>
														v === "all"
															? "Όλοι"
															: (drivers.find((d) => String(d.id) === v)
																?.fullName ?? v)
													}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">Όλοι</SelectItem>
												{drivers.map((d) => (
													<SelectItem key={d.id} value={String(d.id)}>
														{d.fullName}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1">
										<Label className="text-xs">Όχημα</Label>
										<Select
											value={vehicleId}
											onValueChange={(v) => setVehicleId(v ?? "all")}
										>
											<SelectTrigger className="h-8 w-full bg-white text-[#333333]">
												<SelectValue>
													{(v: string | null) =>
														v === "all"
															? "Όλα"
															: (vehicles.find((vh) => String(vh.id) === v)
																?.name ?? v)
													}
												</SelectValue>
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="all">Όλα</SelectItem>
												{vehicles.map((v) => (
													<SelectItem key={v.id} value={String(v.id)}>
														{v.name} ({v.plate})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</>
							) : (
								<div className="space-y-1">
									<Label className="text-xs">Συνεργάτης</Label>
									<Select
										value={partnerId}
										onValueChange={(v) => setPartnerId(v ?? "all")}
									>
										<SelectTrigger className="h-8 w-full bg-white text-[#333333]">
											<SelectValue>
												{(v: string | null) =>
													v === "all"
														? "Όλοι"
														: (partners.find((p) => String(p.id) === v)?.name ??
															v)
												}
											</SelectValue>
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="all">Όλοι</SelectItem>
											{partners.map((p) => (
												<SelectItem key={p.id} value={String(p.id)}>
													{p.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							)}
						</div>

						<div className="flex flex-col gap-2 pt-1 mt-auto">
							<Button
								size="sm"
								onClick={handleApply}
								disabled={loading}
								className="hover:bg-[#333] hover:ring-2 hover:ring-[#f9cf44]"
							>
								Εφαρμογή
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={handleReset}
								disabled={loading}
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
