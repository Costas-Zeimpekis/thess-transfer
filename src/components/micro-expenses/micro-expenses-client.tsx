"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { FaSlidersH, FaTimes } from "react-icons/fa";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const EXPENSE_CATEGORIES = [
	{ value: "gas", label: "Βενζίνη" },
	{ value: "food", label: "Φαγητό" },
	{ value: "fine", label: "Πρόστιμο" },
	{ value: "customer", label: "Πελάτης" },
	{ value: "driver", label: "Οδηγός" },
	{ value: "other", label: "Άλλο" },
];

type Driver = { id: number; fullName: string };

type MicroExpense = {
	id: number;
	driverId: number | null;
	driverName: string;
	bookingId: number | null;
	reason: string;
	price: string;
	date: string;
	description: string | null;
};

type NewExpenseState = {
	driverId: string;
	reason: string;
	price: string;
	date: string;
	description: string;
};

type EditState = NewExpenseState;

type Props = {
	drivers: Driver[];
	initialExpenses: MicroExpense[];
};

function todayIso() {
	return new Date().toISOString().slice(0, 10);
}

function reasonLabel(reason: string) {
	return EXPENSE_CATEGORIES.find((c) => c.value === reason)?.label ?? reason;
}

export default function MicroExpensesClient({
	drivers,
	initialExpenses,
}: Props) {
	const [expenses, setExpenses] = useState<MicroExpense[]>(initialExpenses);
	const [newExpense, setNewExpense] = useState<NewExpenseState | null>(null);
	const [editId, setEditId] = useState<number | null>(null);
	const [editState, setEditState] = useState<EditState | null>(null);
	const [saving, setSaving] = useState(false);
	const [filtersOpen, setFiltersOpen] = useState(false);

	const [filterDriver, setFilterDriver] = useState("all");
	const [filterFrom, setFilterFrom] = useState("");
	const [filterTo, setFilterTo] = useState("");
	const [appliedDriver, setAppliedDriver] = useState("all");
	const [appliedFrom, setAppliedFrom] = useState("");
	const [appliedTo, setAppliedTo] = useState("");

	function handleApplyFilters() {
		setAppliedDriver(filterDriver);
		setAppliedFrom(filterFrom);
		setAppliedTo(filterTo);
	}

	function handleResetFilters() {
		setFilterDriver("all");
		setFilterFrom("");
		setFilterTo("");
		setAppliedDriver("all");
		setAppliedFrom("");
		setAppliedTo("");
	}

	const filtered = useMemo(() => {
		let list = expenses;
		if (appliedDriver !== "all")
			list = list.filter((e) => String(e.driverId) === appliedDriver);
		if (appliedFrom)
			list = list.filter((e) => e.date >= appliedFrom);
		if (appliedTo)
			list = list.filter((e) => e.date <= appliedTo);
		return list;
	}, [expenses, appliedDriver, appliedFrom, appliedTo]);

	const total = useMemo(
		() => filtered.reduce((sum, e) => sum + parseFloat(e.price || "0"), 0),
		[filtered],
	);

	const activeFilterCount = [
		appliedDriver !== "all",
		appliedFrom !== "",
		appliedTo !== "",
	].filter(Boolean).length;

	function handleAddNew() {
		setNewExpense({
			driverId: drivers[0] ? String(drivers[0].id) : "",
			reason: "gas",
			price: "",
			date: todayIso(),
			description: "",
		});
	}

	function handleCancelNew() {
		setNewExpense(null);
	}

	async function handleSaveNew() {
		if (!newExpense) return;
		if (!newExpense.driverId || !newExpense.reason || !newExpense.price || !newExpense.date) {
			toast.error("Συμπληρώστε όλα τα υποχρεωτικά πεδία");
			return;
		}
		setSaving(true);
		try {
			const res = await fetch("/api/micro-expenses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					driver_id: parseInt(newExpense.driverId),
					reason: newExpense.reason,
					price: newExpense.price,
					date: newExpense.date,
					description: newExpense.description || null,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				toast.error(data.error ?? "Σφάλμα αποθήκευσης");
				return;
			}
			const created = await res.json();
			const driver = drivers.find((d) => d.id === created.driverId);
			setExpenses((prev) => [
				{ ...created, driverName: driver?.fullName ?? "" },
				...prev,
			]);
			setNewExpense(null);
			toast.success("Το μικροέξοδο αποθηκεύτηκε");
		} finally {
			setSaving(false);
		}
	}

	function handleStartEdit(expense: MicroExpense) {
		setEditId(expense.id);
		setEditState({
			driverId: String(expense.driverId),
			reason: expense.reason,
			price: expense.price,
			date: expense.date,
			description: expense.description ?? "",
		});
	}

	function handleCancelEdit() {
		setEditId(null);
		setEditState(null);
	}

	async function handleSaveEdit(id: number) {
		if (!editState) return;
		if (!editState.driverId || !editState.reason || !editState.price || !editState.date) {
			toast.error("Συμπληρώστε όλα τα υποχρεωτικά πεδία");
			return;
		}
		setSaving(true);
		try {
			const res = await fetch(`/api/micro-expenses/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					driver_id: parseInt(editState.driverId),
					reason: editState.reason,
					price: editState.price,
					date: editState.date,
					description: editState.description || null,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				toast.error(data.error ?? "Σφάλμα αποθήκευσης");
				return;
			}
			const updated = await res.json();
			const driver = drivers.find((d) => d.id === updated.driverId);
			setExpenses((prev) =>
				prev.map((e) =>
					e.id === id ? { ...updated, driverName: driver?.fullName ?? "" } : e,
				),
			);
			setEditId(null);
			setEditState(null);
			toast.success("Το μικροέξοδο ενημερώθηκε");
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(id: number) {
		if (!confirm("Διαγραφή μικροεξόδου;")) return;
		const res = await fetch(`/api/micro-expenses/${id}`, { method: "DELETE" });
		if (!res.ok) {
			toast.error("Σφάλμα διαγραφής");
			return;
		}
		setExpenses((prev) => prev.filter((e) => e.id !== id));
		toast.success("Το μικροέξοδο διαγράφηκε");
	}

	return (
		<div className="flex gap-2 items-stretch flex-1 min-h-0">
			{/* Main content */}
			<div className="flex-1 min-w-0 bg-white p-4 flex flex-col min-h-0 gap-4">
				<div className="flex items-center gap-3">
					<Navigation />
					<div className="flex-1" />
					<Button onClick={handleAddNew} disabled={!!newExpense}>
						<Plus size={16} className="mr-1" />
						Νέο Μικροέξοδο
					</Button>
				</div>

				{newExpense && (
					<div className="rounded-md border border-[#f9cf44] bg-amber-50 p-4 flex flex-col gap-3">
						<p className="font-semibold text-sm text-[#333]">Νέο Μικροέξοδο</p>
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
							<div className="flex flex-col gap-1">
								<Label className="text-xs">Οδηγός *</Label>
								<Select
									value={newExpense.driverId}
									onValueChange={(v) =>
										setNewExpense((s) => s && { ...s, driverId: v ?? "" })
									}
								>
									<SelectTrigger className="h-8 text-sm bg-white">
										<SelectValue placeholder="Επιλογή…" />
									</SelectTrigger>
									<SelectContent>
										{drivers.map((d) => (
											<SelectItem key={d.id} value={String(d.id)}>
												{d.fullName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-1">
								<Label className="text-xs">Κατηγορία *</Label>
								<Select
									value={newExpense.reason}
									onValueChange={(v) =>
										setNewExpense((s) => s && { ...s, reason: v ?? "" })
									}
								>
									<SelectTrigger className="h-8 text-sm bg-white">
										<SelectValue placeholder="Επιλογή…" />
									</SelectTrigger>
									<SelectContent>
										{EXPENSE_CATEGORIES.map((c) => (
											<SelectItem key={c.value} value={c.value}>
												{c.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="flex flex-col gap-1">
								<Label className="text-xs">Ποσό (€) *</Label>
								<Input
									type="number"
									min="0"
									step="0.01"
									className="h-8 text-sm bg-white"
									value={newExpense.price}
									onChange={(e) =>
										setNewExpense((s) => s && { ...s, price: e.target.value })
									}
								/>
							</div>
							<div className="flex flex-col gap-1">
								<Label className="text-xs">Ημερομηνία *</Label>
								<Input
									type="date"
									className="h-8 text-sm bg-white"
									value={newExpense.date}
									onChange={(e) =>
										setNewExpense((s) => s && { ...s, date: e.target.value })
									}
								/>
							</div>
						</div>
						<div className="flex flex-col gap-1">
							<Label className="text-xs">Περιγραφή</Label>
							<Textarea
								rows={2}
								className="text-sm bg-white resize-none"
								value={newExpense.description}
								onChange={(e) =>
									setNewExpense((s) => s && { ...s, description: e.target.value })
								}
							/>
						</div>
						<div className="flex gap-2 justify-end">
							<Button size="sm" variant="outline" onClick={handleCancelNew} disabled={saving}>
								Ακύρωση
							</Button>
							<Button size="sm" onClick={handleSaveNew} disabled={saving}>
								Αποθήκευση
							</Button>
						</div>
					</div>
				)}

				<div className="rounded-md border border-t-4 border-t-[#f9cf44] overflow-x-scroll overflow-y-scroll flex-1 min-h-0">
					<div className="min-w-max">
					<Table>
						<TableHeader className="sticky top-0 z-10 [&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-muted">
							<TableRow className="bg-muted">
								<TableHead className="font-extrabold bg-[#f9cf44] text-[#333333] w-[120px]">
									Ημερομηνία
								</TableHead>
								<TableHead className="font-extrabold">Οδηγός</TableHead>
								<TableHead className="font-extrabold">Κατηγορία</TableHead>
								<TableHead className="font-extrabold">Ποσό</TableHead>
								<TableHead className="font-extrabold">Περιγραφή</TableHead>
								<TableHead className="font-extrabold w-[100px]" />
							</TableRow>
						</TableHeader>
						<TableBody>
							{filtered.length === 0 && (
								<TableRow>
									<TableCell colSpan={6} className="text-center text-muted-foreground py-8">
										Δεν βρέθηκαν μικροέξοδα
									</TableCell>
								</TableRow>
							)}
							{filtered.map((expense) =>
								editId === expense.id && editState ? (
									<TableRow key={expense.id} className="bg-amber-50">
										<TableCell className="p-1">
											<Input
												type="date"
												className="h-8 text-sm"
												value={editState.date}
												onChange={(e) =>
													setEditState((s) => s && { ...s, date: e.target.value })
												}
											/>
										</TableCell>
										<TableCell className="p-1">
											<Select
												value={editState.driverId}
												onValueChange={(v) =>
													setEditState((s) => s && { ...s, driverId: v ?? "" })
												}
											>
												<SelectTrigger className="h-8 text-sm">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{drivers.map((d) => (
														<SelectItem key={d.id} value={String(d.id)}>
															{d.fullName}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</TableCell>
										<TableCell className="p-1">
											<Select
												value={editState.reason}
												onValueChange={(v) =>
													setEditState((s) => s && { ...s, reason: v ?? "" })
												}
											>
												<SelectTrigger className="h-8 text-sm">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{EXPENSE_CATEGORIES.map((c) => (
														<SelectItem key={c.value} value={c.value}>
															{c.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</TableCell>
										<TableCell className="p-1">
											<Input
												type="number"
												min="0"
												step="0.01"
												className="h-8 text-sm w-24"
												value={editState.price}
												onChange={(e) =>
													setEditState((s) => s && { ...s, price: e.target.value })
												}
											/>
										</TableCell>
										<TableCell className="p-1">
											<Input
												className="h-8 text-sm"
												value={editState.description}
												onChange={(e) =>
													setEditState((s) => s && { ...s, description: e.target.value })
												}
											/>
										</TableCell>
										<TableCell className="p-1">
											<div className="flex gap-1">
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8 text-green-600"
													disabled={saving}
													onClick={() => handleSaveEdit(expense.id)}
												>
													<Check size={15} />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8 text-muted-foreground"
													onClick={handleCancelEdit}
												>
													<X size={15} />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								) : (
									<TableRow key={expense.id}>
										<TableCell className="font-mono text-sm">{expense.date}</TableCell>
										<TableCell>{expense.driverName}</TableCell>
										<TableCell>{reasonLabel(expense.reason)}</TableCell>
										<TableCell className="font-medium">
											€{parseFloat(expense.price).toFixed(2)}
										</TableCell>
										<TableCell className="text-muted-foreground text-sm">
											{expense.description ?? "—"}
										</TableCell>
										<TableCell>
											<div className="flex gap-1">
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8"
													onClick={() => handleStartEdit(expense)}
												>
													<Pencil size={14} />
												</Button>
												<Button
													size="icon"
													variant="ghost"
													className="h-8 w-8 text-red-500 hover:text-red-700"
													onClick={() => handleDelete(expense.id)}
												>
													<Trash2 size={14} />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								),
							)}
						</TableBody>
					</Table>
					</div>
				</div>

				<div className="flex justify-end pr-2">
					<span className="text-sm font-semibold">
						Σύνολο:{" "}
						<span className="font-mono text-base">€{total.toFixed(2)}</span>
					</span>
				</div>
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
							<Label className="text-xs">Οδηγός</Label>
							<Select value={filterDriver} onValueChange={(v) => setFilterDriver(v ?? "all")}>
								<SelectTrigger className="h-8 bg-white text-[#333333] text-sm">
									<SelectValue placeholder="Όλοι" />
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
							<Label className="text-xs">Από</Label>
							<Input
								type="date"
								className="h-8 bg-white text-[#333333] text-sm"
								value={filterFrom}
								onChange={(e) => setFilterFrom(e.target.value)}
							/>
						</div>

						<div className="space-y-1">
							<Label className="text-xs">Έως</Label>
							<Input
								type="date"
								className="h-8 bg-white text-[#333333] text-sm"
								value={filterTo}
								onChange={(e) => setFilterTo(e.target.value)}
							/>
						</div>

						<div className="flex flex-col gap-2 pt-1 mt-auto">
							<Button
								size="sm"
								onClick={handleApplyFilters}
								className="hover:bg-[#333] hover:ring-2 hover:ring-[#f9cf44]"
							>
								Εφαρμογή
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={handleResetFilters}
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
