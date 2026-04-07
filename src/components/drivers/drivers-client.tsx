"use client";

import { Pencil, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Navigation from "../ui/navigation";
import DriverSheet, { type Driver } from "./driver-sheet";

type DriversClientProps = {
	drivers: Driver[];
};

export default function DriversClient({
	drivers: initialDrivers,
}: DriversClientProps) {
	const router = useRouter();
	const [sheetOpen, setSheetOpen] = useState(false);
	const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

	function handleCreate() {
		router.push("/drivers/new");
	}

	function handleEdit(driver: Driver) {
		setEditingDriver(driver);
		setSheetOpen(true);
	}

	async function handleDeactivate(driver: Driver) {
		if (!confirm(`Απενεργοποίηση οδηγού "${driver.fullName}";`)) return;
		await fetch(`/api/drivers/${driver.id}`, { method: "DELETE" });
		router.refresh();
	}

	function handleSuccess() {
		router.refresh();
	}

	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<Navigation />
				<Button onClick={handleCreate}>Νέος Οδηγός</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Ονοματεπώνυμο</TableHead>
							<TableHead>Τηλέφωνο</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Κατάσταση</TableHead>
							<TableHead className="text-right">Ενέργειες</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{initialDrivers.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-muted-foreground py-8"
								>
									Δεν βρέθηκαν οδηγοί
								</TableCell>
							</TableRow>
						)}
						{initialDrivers.map((driver) => (
							<TableRow key={driver.id}>
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
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleEdit(driver)}
											title="Επεξεργασία"
										>
											<Pencil className="h-4 w-4" />
										</Button>
										{driver.active && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleDeactivate(driver)}
												title="Απενεργοποίηση"
											>
												<UserX className="h-4 w-4" />
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<DriverSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				driver={editingDriver}
				onSuccess={handleSuccess}
			/>
		</>
	);
}
