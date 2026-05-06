"use client";

import { KeyRound, LogOut } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";
export default function DashboardShell({
	username,
	children,
}: {
	username: string;
	children: React.ReactNode;
}) {
	const router = useRouter();

	const [changePasswordOpen, setChangePasswordOpen] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [changePasswordError, setChangePasswordError] = useState("");
	const [changePasswordLoading, setChangePasswordLoading] = useState(false);

	async function handleLogout() {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
	}

	async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setChangePasswordError("");
		setChangePasswordLoading(true);

		try {
			const res = await fetch("/api/auth/change-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ currentPassword, newPassword }),
			});

			if (res.ok) {
				setChangePasswordOpen(false);
				setCurrentPassword("");
				setNewPassword("");
			} else {
				const data = await res.json();
				setChangePasswordError(data.error ?? "Σφάλμα. Δοκιμάστε ξανά.");
			}
		} catch {
			setChangePasswordError("Σφάλμα. Δοκιμάστε ξανά.");
		} finally {
			setChangePasswordLoading(false);
		}
	}

	function handleChangePasswordOpenChange(open: boolean) {
		setChangePasswordOpen(open);
		if (!open) {
			setCurrentPassword("");
			setNewPassword("");
			setChangePasswordError("");
		}
	}

	return (
		<>
		<TooltipProvider>
			<div className="h-screen flex flex-col overflow-hidden">
				{/* Top bar: brand + user actions */}
				<div className="flex h-12 py-12 items-center gap-4 px-6 border-b bg-[#333333] text-[#f9cf44]">
					<Image
						alt="Thess Transfers"
						className="object-contain"
						height={160}
						priority
						src="/logo.webp"
						width={320}
					/>
					<div className="flex-1" />
					<span className="text-sm hidden sm:inline">{username}</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setChangePasswordOpen(true)}
						className="gap-1.5 text-[#f9cf44] hover:bg-[#f9cf44]/20 hover:text-[#f9cf44]"
					>
						<KeyRound className="h-4 w-4" />
						<span className="hidden sm:inline">Αλλαγή κωδικού</span>
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={handleLogout}
						className="gap-1.5 text-[#f9cf44] hover:bg-[#f9cf44]/20 hover:text-[#f9cf44]"
					>
						<LogOut className="h-4 w-4" />
						<span className="hidden sm:inline">Αποσύνδεση</span>
					</Button>
				</div>

				{/* Page content */}
				<main className="flex-1 min-h-0 p-6 bg-[#eee] overflow-auto flex flex-col">
					{children}
				</main>
			</div>

			{/* Change password dialog */}
			<Dialog
				open={changePasswordOpen}
				onOpenChange={handleChangePasswordOpenChange}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Αλλαγή κωδικού</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleChangePassword} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="currentPassword">Τρέχων κωδικός</Label>
							<Input
								id="currentPassword"
								type="password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								required
								disabled={changePasswordLoading}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="newPassword">Νέος κωδικός</Label>
							<Input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
								disabled={changePasswordLoading}
							/>
						</div>
						{changePasswordError && (
							<p className="text-sm text-destructive">{changePasswordError}</p>
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => handleChangePasswordOpenChange(false)}
								disabled={changePasswordLoading}
							>
								Ακύρωση
							</Button>
							<Button type="submit" disabled={changePasswordLoading}>
								{changePasswordLoading ? "Αποθήκευση..." : "Αποθήκευση"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</TooltipProvider>
		<Toaster position="top-right" closeButton closeOnClick={false} />
		</>
	);
}
