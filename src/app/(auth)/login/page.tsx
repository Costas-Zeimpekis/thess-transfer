"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});

			if (res.ok) {
				router.push("/bookings");
			} else {
				setError("Λάθος όνομα χρήστη ή κωδικός");
			}
		} catch {
			setError("Λάθος όνομα χρήστη ή κωδικός");
		} finally {
			setLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-sm bg-[#333333]">
			<CardHeader className="items-center gap-4">
				<Image
					src="/logo.webp"
					alt="Thess Transfers"
					width={320}
					height={160}
					className="object-contain"
					priority
				/>
				<CardTitle className="text-center text-2xl">Σύνδεση</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="username" className="text-[#f9cf44]">
							Όνομα χρήστη
						</Label>
						<Input
							autoComplete="username"
							className="bg-white text-[#333333]"
							disabled={loading}
							id="username"
							onChange={(e) => setUsername(e.target.value)}
							onKeyDown={(event) => {
								if(event.key === 'Enter') {
									handleSubmit(event)
								}
							}}
							required
							type="text"
							value={username}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password" className="text-[#f9cf44]">
							Κωδικός
						</Label>
						<Input
							autoComplete="current-password"
							className="bg-white text-[#333333]"
							disabled={loading}
							id="password"
							onChange={(e) => setPassword(e.target.value)}
							onKeyDown={(e) => {
									if (e.key === 'Enter') {
										// We prevent the default browser behavior and manually trigger submit
										handleSubmit(e); 
									}
								}}
							required
							type="password"
							value={password}
						/>
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Σύνδεση..." : "Σύνδεση"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
