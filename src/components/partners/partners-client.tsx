"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import Navigation from "../ui/navigation";
import PartnerSheet, { type Partner } from "./partner-sheet";

type PartnersClientProps = {
	partners: Partner[];
};

export default function PartnersClient({
	partners: initialPartners,
}: PartnersClientProps) {
	const router = useRouter();
	const [sheetOpen, setSheetOpen] = useState(false);
	const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);

	function handleCreate() {
		router.push("/partners/new");
	}

	function handleEdit(partner: Partner) {
		setEditingPartner(partner);
		setSheetOpen(true);
	}

	function handleDeletePrompt(partner: Partner) {
		setDeleteTarget(partner);
	}

	async function handleDeleteConfirm() {
		if (!deleteTarget) return;
		setDeleteLoading(true);
		try {
			await fetch(`/api/partners/${deleteTarget.id}`, { method: "DELETE" });
			setDeleteTarget(null);
			router.refresh();
		} finally {
			setDeleteLoading(false);
		}
	}

	function handleSuccess() {
		router.refresh();
	}

	return (
		<>
			<div className="flex items-center justify-between mb-6">
				<Navigation />
				<Button onClick={handleCreate}>Νέος Συνεργάτης</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Επωνυμία</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Τηλέφωνο</TableHead>
							<TableHead className="text-right">Ενέργειες</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{initialPartners.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center text-muted-foreground py-8"
								>
									Δεν βρέθηκαν συνεργάτες
								</TableCell>
							</TableRow>
						)}
						{initialPartners.map((partner) => (
							<TableRow key={partner.id}>
								<TableCell className="font-medium">{partner.name}</TableCell>
								<TableCell>{partner.email ?? "—"}</TableCell>
								<TableCell>{partner.phone ?? "—"}</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleEdit(partner)}
											title="Επεξεργασία"
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => handleDeletePrompt(partner)}
											title="Διαγραφή"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<PartnerSheet
				open={sheetOpen}
				onOpenChange={setSheetOpen}
				partner={editingPartner}
				onSuccess={handleSuccess}
			/>

			<Dialog
				open={!!deleteTarget}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Διαγραφή Συνεργάτη</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						Είστε σίγουροι ότι θέλετε να διαγράψετε τον συνεργάτη{" "}
						<strong>{deleteTarget?.name}</strong>; Η ενέργεια δεν μπορεί να
						αναιρεθεί.
					</p>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteTarget(null)}
							disabled={deleteLoading}
						>
							Ακύρωση
						</Button>
						<Button
							variant="destructive"
							onClick={handleDeleteConfirm}
							disabled={deleteLoading}
						>
							{deleteLoading ? "Διαγραφή..." : "Διαγραφή"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
