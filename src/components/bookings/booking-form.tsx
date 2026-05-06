"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type BookingFormData } from "./booking-sheet";

type Provider = { id: number; name: string };
type Driver = { id: number; fullName: string };
type Vehicle = { id: number; name: string; plate: string };
type Partner = { id: number; name: string };
type HistoryEntry = {
	id: number;
	action: string;
	changes: unknown;
	createdAt: Date | string | null;
};

const STATUS_LABELS: Record<string, string> = {
	pending: "Εκκρεμής",
	confirmed: "Επιβεβαιωμένη",
	completed: "Ολοκληρωμένη",
	cancelled: "Ακυρωμένη",
};

function statusClass(status: string): string {
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

type BookingFormProps = {
	booking?: BookingFormData | null;
	providers: Provider[];
	drivers?: Driver[];
	vehicles?: Vehicle[];
	partners?: Partner[];
	actions?: React.ReactNode;
	history?: HistoryEntry[];
};

export default function BookingForm({
	booking,
	providers,
	drivers,
	vehicles,
	partners,
	actions,
	history,
}: BookingFormProps) {
	const router = useRouter();
	const isEdit = !!booking;

	const [providerBookingRef, setProviderBookingRef] = useState(
		booking?.providerBookingRef ?? "",
	);
	const [providerId, setProviderId] = useState(
		booking?.providerId ? String(booking.providerId) : "",
	);
	const [bookingType, setBookingType] = useState<"provider" | "own">(
		booking?.source === "manual" ? "own" : "provider",
	);
	const [pickupDatetime, setPickupDatetime] = useState(
		booking?.pickupDatetime
			? new Date(booking.pickupDatetime).toISOString().slice(0, 16)
			: "",
	);
	const [flightNumber, setFlightNumber] = useState(booking?.flightNumber ?? "");
	const [pickupLocation, setPickupLocation] = useState(
		booking?.pickupLocation ?? "",
	);
	const [dropoffLocation, setDropoffLocation] = useState(
		booking?.dropoffLocation ?? "",
	);
	const [passengerCount, setPassengerCount] = useState(
		String(booking?.passengerCount ?? 1),
	);
	const [vehicleType, setVehicleType] = useState(booking?.vehicleType ?? "car");
	const [babySeat, setBabySeat] = useState<number>(booking?.babySeat ?? 0);
	const [boosterSeat, setBoosterSeat] = useState<number>(booking?.boosterSeat ?? 0);
	const [customerName, setCustomerName] = useState(booking?.customerName ?? "");
	const [customerPhone, setCustomerPhone] = useState(
		booking?.customerPhone ?? "",
	);
	const [customerEmail, setCustomerEmail] = useState(
		booking?.customerEmail ?? "",
	);
	const [paymentMethod, setPaymentMethod] = useState(
		booking?.paymentMethod ?? "none",
	);
	const [realPrice, setRealPrice] = useState(booking?.realPrice ?? "");
	const [declaredPrice, setDeclaredPrice] = useState(
		booking?.declaredPrice ?? "",
	);
	const [notes, setNotes] = useState(booking?.notes ?? "");
	const [assignMode, setAssignMode] = useState<"driver" | "partner">(
		booking?.partnerId != null ? "partner" : "driver",
	);
	const [assignDriverId, setAssignDriverId] = useState(
		booking?.driverId ? String(booking.driverId) : "",
	);
	const [assignVehicleId, setAssignVehicleId] = useState(
		booking?.vehicleId ? String(booking.vehicleId) : "",
	);
	const [assignPartnerId, setAssignPartnerId] = useState(
		booking?.partnerId ? String(booking.partnerId) : "",
	);
	const [assignPartnerPrice, setAssignPartnerPrice] = useState(
		booking?.partnerAssignmentPrice ?? "",
	);

	const [loading, setLoading] = useState(false);
	const [transitioning, setTransitioning] = useState(false);
	const [error, setError] = useState("");
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

	function clearError(field: string) {
		setFieldErrors((prev) => {
			if (!prev[field]) return prev;
			const next = { ...prev };
			delete next[field];
			return next;
		});
	}

	function validate(): boolean {
		// Pending bookings are drafts — skip validation
		if (booking?.status === "pending") return true;

		const errors: Record<string, string> = {};

		if (bookingType === "provider") {
			if (!providerId) errors.providerId = "Επιλέξτε πάροχο";
			if (!providerBookingRef.trim())
				errors.providerBookingRef = "Συμπληρώστε το Ref Παρόχου";
		}
		if (!pickupDatetime)
			errors.pickupDatetime = "Συμπληρώστε ημερομηνία & ώρα παραλαβής";
		if (!pickupLocation.trim())
			errors.pickupLocation = "Συμπληρώστε τόπο παραλαβής";
		if (!dropoffLocation.trim())
			errors.dropoffLocation = "Συμπληρώστε τόπο αποστολής";
		if (!customerName.trim())
			errors.customerName = "Συμπληρώστε ονοματεπώνυμο";
		if (!passengerCount || parseInt(passengerCount, 10) < 1)
			errors.passengerCount = "Συμπληρώστε αριθμό επιβατών";

		setFieldErrors(errors);
		return Object.keys(errors).length === 0;
	}

	const declaredPriceLocked = isEdit && booking?.status === "completed";
	const isAssignmentLocked =
		isEdit &&
		(booking?.status === "completed" || booking?.status === "cancelled");


	async function transitionStatus(newStatus: string, confirmMsg?: string) {
		if (confirmMsg && !confirm(confirmMsg)) return;
		setTransitioning(true);
		try {
			const res = await fetch(`/api/bookings/${booking!.id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ status: newStatus }),
			});
			if (!res.ok) {
				const data = await res.json();
				setError(data.error ?? "Σφάλμα κατά την αλλαγή κατάστασης.");
			} else {
				router.refresh();
			}
		} catch {
			setError("Σφάλμα. Δοκιμάστε ξανά.");
		} finally {
			setTransitioning(false);
		}
	}

	const statusTransitions: {
		label: string;
		status: string;
		className?: string;
		variant?: "outline";
		confirm?: string;
	}[] =
		booking?.status === "pending"
			? [
					{
						label: "Επιβεβαίωση",
						status: "confirmed",
						className: "bg-blue-600 hover:bg-blue-700 text-white border-0",
					},
					{
						label: "Ακύρωση κράτησης",
						status: "cancelled",
						className: "bg-red-600 hover:bg-red-700 text-white border-0",
						confirm: "Είστε σίγουρος ότι θέλετε να ακυρώσετε αυτή την κράτηση;",
					},
				]
			: booking?.status === "confirmed"
				? [
						{
							label: "← Εκκρεμής",
							status: "pending",
							className: "variant-outline",
							variant: "outline" as const,
						},
						{
							label: "✓ Ολοκλήρωση",
							status: "completed",
							className: "bg-green-600 hover:bg-green-700 text-white border-0",
							confirm: "Επιβεβαιώνετε την ολοκλήρωση της κράτησης;",
						},
						{
							label: "Ακύρωση κράτησης",
							status: "cancelled",
							className: "bg-red-600 hover:bg-red-700 text-white border-0",
							confirm:
								"Είστε σίγουρος ότι θέλετε να ακυρώσετε αυτή την κράτηση;",
						},
					]
				: [];

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		if (!validate()) return;
		setLoading(true);

		try {
			const url = isEdit ? `/api/bookings/${booking!.id}` : "/api/bookings";
			const method = isEdit ? "PUT" : "POST";

			const body: Record<string, unknown> = {
				source: bookingType === "own" ? "manual" : "automatic",
				provider_booking_ref:
					bookingType === "provider" ? providerBookingRef : null,
				provider_id:
					bookingType === "provider" ? parseInt(providerId, 10) : null,
				pickup_datetime: pickupDatetime,
				flight_number: flightNumber || null,
				pickup_location: pickupLocation,
				dropoff_location: dropoffLocation,
				passenger_count: parseInt(passengerCount, 10),
				vehicle_type: vehicleType,
				baby_seat: babySeat,
				booster_seat: boosterSeat,
				customer_name: customerName,
				customer_phone: customerPhone || null,
				customer_email: customerEmail || null,
				payment_method: paymentMethod === "none" ? null : paymentMethod,
				notes: notes || null,
				real_price: realPrice ? parseFloat(realPrice) : null,
			};

			if (!declaredPriceLocked) {
				body.declared_price = declaredPrice ? parseFloat(declaredPrice) : null;
			}

			if (isEdit && drivers && vehicles && partners) {
				if (assignMode === "driver") {
					body.driver_id = assignDriverId ? parseInt(assignDriverId, 10) : null;
					body.vehicle_id = assignVehicleId
						? parseInt(assignVehicleId, 10)
						: null;
					body.partner_id = null;
					body.partner_assignment_price = null;
				} else {
					body.partner_id = assignPartnerId
						? parseInt(assignPartnerId, 10)
						: null;
					body.partner_assignment_price = assignPartnerPrice
						? parseFloat(assignPartnerPrice)
						: null;
					body.driver_id = null;
					body.vehicle_id = null;
				}
			}

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error ?? "Σφάλμα. Δοκιμάστε ξανά.");
				return;
			}

			if (isEdit) {
				router.refresh();
			} else {
				const data = await res.json();
				router.push(`/bookings/${data.id}`);
			}
		} catch {
			setError("Σφάλμα. Δοκιμάστε ξανά.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="w-full flex gap-6 items-start">
			<div className="space-y-6 flex-1 min-w-0">
				{/* Header */}
				<div className="flex items-center justify-between bg-white p-4 rounded-xl">
					<div className="flex items-center gap-3">
						<Link
							href="/bookings"
							className="inline-flex h-7 items-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted transition-colors"
						>
							← Πίσω
						</Link>
						<h1 className="text-2xl font-semibold">
							{isEdit ? `Κράτηση #${booking?.id}` : "Νέα Κράτηση"}
						</h1>
						{isEdit && booking?.status && (
							<Badge variant="outline" className={statusClass(booking.status)}>
								{STATUS_LABELS[booking.status] ?? booking.status}
							</Badge>
						)}
						{isEdit && booking?.createdAt && (
							<span className="text-xs text-muted-foreground">
								{new Date(booking.createdAt).toLocaleString("el-GR", {
									day: "2-digit",
									month: "2-digit",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
									second: "2-digit",
									hour12: false,
								})}
							</span>
						)}
					</div>
					<div className="flex gap-2">
						{isEdit && booking?.id && (
							<Link
								href={`/bookings/${booking.id}/print`}
								target="_blank"
								className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
							>
								Εκτύπωση / PDF
							</Link>
						)}
						{actions}
						{isEdit &&
							statusTransitions.map((t) => (
								<Button
									key={t.status}
									type="button"
									variant={t.variant ?? "default"}
									className={t.variant ? undefined : t.className}
									onClick={() => transitionStatus(t.status, t.confirm)}
									disabled={transitioning || loading}
								>
									{t.label}
								</Button>
							))}
						<Button type="submit" form="booking-form" disabled={loading}>
							{loading ? "Αποθήκευση…" : "Αποθήκευση"}
						</Button>
					</div>
				</div>
				<div className="flex flex-row gap-6 w-full items-stretch">
					<div className="flex-1 min-w-0 h-full">
						<form
							id="booking-form"
							onSubmit={handleSubmit}
							className="space-y-6"
							noValidate
						>
							{/* Στοιχεία Κράτησης */}
							<Card className="h-[380px] overflow-auto">
								<CardHeader>
									<CardTitle className="text-base text-black size-5 w-full font-semibold">
										Στοιχεία Κράτησης
									</CardTitle>
									<hr className="border-b-2 border-b-[#f9cf44]" />
								</CardHeader>
								<CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-2">
									{/* Booking type toggle */}
									<div className="col-span-2 flex gap-2 mb-2">
										<button
											type="button"
											onClick={() => setBookingType("provider")}
											disabled={loading}
											className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${bookingType === "provider" ? "bg-[#f9cf44] border-[#f9cf44] text-black" : "border-border bg-white text-muted-foreground hover:bg-muted"}`}
										>
											Από Πάροχο
										</button>
										<button
											type="button"
											onClick={() => setBookingType("own")}
											disabled={loading}
											className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${bookingType === "own" ? "bg-[#f9cf44] border-[#f9cf44] text-black" : "border-border bg-white text-muted-foreground hover:bg-muted"}`}
										>
											Δική μας
										</button>
									</div>

									{bookingType === "provider" && (
										<>
											<div className="space-y-2">
												<Label className={fieldErrors.providerId ? "text-red-500" : ""}>Πάροχος *</Label>
												<Select
													value={providerId}
													onValueChange={(v) => { setProviderId(v ?? ""); clearError("providerId"); }}
													disabled={loading}
												>
													<SelectTrigger className={fieldErrors.providerId ? "border-red-500 focus-visible:ring-red-500" : ""}>
														<SelectValue placeholder="Επιλογή παρόχου">
															{(v: string | null) =>
																providers.find((p) => String(p.id) === v)
																	?.name ?? v
															}
														</SelectValue>
													</SelectTrigger>
													<SelectContent>
														{providers.map((p) => (
															<SelectItem key={p.id} value={String(p.id)}>
																{p.name}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
												{fieldErrors.providerId && (
													<p className="text-xs text-red-500">{fieldErrors.providerId}</p>
												)}
											</div>

											<div className="space-y-2">
												<Label htmlFor="providerBookingRef" className={fieldErrors.providerBookingRef ? "text-red-500" : ""}>
													Ref Παρόχου *
												</Label>
												<Input
													id="providerBookingRef"
													value={providerBookingRef}
													onChange={(e) => { setProviderBookingRef(e.target.value); clearError("providerBookingRef"); }}
													className={fieldErrors.providerBookingRef ? "border-red-500 focus-visible:ring-red-500" : ""}
													disabled={loading}
												/>
												{fieldErrors.providerBookingRef && (
													<p className="text-xs text-red-500">{fieldErrors.providerBookingRef}</p>
												)}
											</div>
										</>
									)}

									<div className="space-y-2">
									<Label htmlFor="pickupDatetime" className={fieldErrors.pickupDatetime ? "text-red-500" : ""}>
										Ημερομηνία & Ώρα Παραλαβής *
									</Label>
									<Input
										id="pickupDatetime"
										type="datetime-local"
										value={pickupDatetime}
										onChange={(e) => { setPickupDatetime(e.target.value); clearError("pickupDatetime"); }}
										className={fieldErrors.pickupDatetime ? "border-red-500 focus-visible:ring-red-500" : ""}
										disabled={loading}
									/>
									{fieldErrors.pickupDatetime && (
										<p className="text-xs text-red-500">{fieldErrors.pickupDatetime}</p>
									)}
									</div>

									<div className="space-y-2">
										<Label htmlFor="flightNumber">Αρ. Πτήσης</Label>
										<Input
											id="flightNumber"
											value={flightNumber}
											onChange={(e) => setFlightNumber(e.target.value)}
											disabled={loading}
										/>
									</div>

									<div className="space-y-2">
									<Label htmlFor="pickupLocation" className={fieldErrors.pickupLocation ? "text-red-500" : ""}>Τόπος Παραλαβής *</Label>
									<Input
										id="pickupLocation"
										value={pickupLocation}
										onChange={(e) => { setPickupLocation(e.target.value); clearError("pickupLocation"); }}
										className={fieldErrors.pickupLocation ? "border-red-500 focus-visible:ring-red-500" : ""}
										disabled={loading}
									/>
									{fieldErrors.pickupLocation && (
										<p className="text-xs text-red-500">{fieldErrors.pickupLocation}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="dropoffLocation" className={fieldErrors.dropoffLocation ? "text-red-500" : ""}>Τόπος Αποστολής *</Label>
									<Input
										id="dropoffLocation"
										value={dropoffLocation}
										onChange={(e) => { setDropoffLocation(e.target.value); clearError("dropoffLocation"); }}
										className={fieldErrors.dropoffLocation ? "border-red-500 focus-visible:ring-red-500" : ""}
										disabled={loading}
									/>
									{fieldErrors.dropoffLocation && (
										<p className="text-xs text-red-500">{fieldErrors.dropoffLocation}</p>
									)}
								</div>

									<div className="flex gap-6 items-end col-span-2">
										<div className="space-y-2">
											<Label>Baby Seat</Label>
											<Select
												value={String(babySeat)}
												onValueChange={(v) => setBabySeat(v ? parseInt(v, 10) : 0)}
												disabled={loading}
											>
												<SelectTrigger className="w-24">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{[0, 1, 2, 3, 4].map((n) => (
														<SelectItem key={n} value={String(n)}>{n}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label>Booster Seat</Label>
											<Select
												value={String(boosterSeat)}
												onValueChange={(v) => setBoosterSeat(v ? parseInt(v, 10) : 0)}
												disabled={loading}
											>
												<SelectTrigger className="w-24">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{[0, 1, 2, 3, 4].map((n) => (
														<SelectItem key={n} value={String(n)}>{n}</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Στοιχεία Πελάτη */}
							<Card className="h-[205px] overflow-auto">
								<CardHeader>
									<CardTitle className="text-base text-black size-5 w-full font-semibold">
										Στοιχεία Πελάτη
									</CardTitle>
									<hr className="border-b-2 border-b-[#f9cf44]" />
								</CardHeader>
								<CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-2">
									<div className="space-y-2">
									<Label htmlFor="customerName" className={fieldErrors.customerName ? "text-red-500" : ""}>Ονοματεπώνυμο *</Label>
									<Input
										id="customerName"
										value={customerName}
										onChange={(e) => { setCustomerName(e.target.value); clearError("customerName"); }}
										className={fieldErrors.customerName ? "border-red-500 focus-visible:ring-red-500" : ""}
										disabled={loading}
									/>
									{fieldErrors.customerName && (
										<p className="text-xs text-red-500">{fieldErrors.customerName}</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="passengerCount" className={fieldErrors.passengerCount ? "text-red-500" : ""}>Αρ. Επιβατών *</Label>
									<Input
										id="passengerCount"
										type="number"
										min={1}
										value={passengerCount}
										onChange={(e) => { setPassengerCount(e.target.value); clearError("passengerCount"); }}
										className={fieldErrors.passengerCount ? "border-red-500 focus-visible:ring-red-500" : ""}
										disabled={loading}
									/>
									{fieldErrors.passengerCount && (
										<p className="text-xs text-red-500">{fieldErrors.passengerCount}</p>
									)}
								</div>

									<div className="space-y-2">
										<Label htmlFor="customerPhone">Τηλέφωνο</Label>
										<Input
											id="customerPhone"
											value={customerPhone}
											onChange={(e) => setCustomerPhone(e.target.value)}
											disabled={loading}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="customerEmail">Email</Label>
										<Input
											id="customerEmail"
											type="email"
											value={customerEmail}
											onChange={(e) => setCustomerEmail(e.target.value)}
											disabled={loading}
										/>
									</div>
								</CardContent>
							</Card>

							{/* Οικονομικά */}
							<Card>
								<CardHeader>
									<CardTitle className="text-base text-black size-5 w-full font-semibold">
										Οικονομικά
									</CardTitle>
									<hr className="border-b-2 border-b-[#f9cf44]" />
								</CardHeader>
								<CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3">
									<div className="space-y-2">
										<Label>Τρόπος Πληρωμής</Label>
										<Select
											value={paymentMethod}
											onValueChange={(v) => setPaymentMethod(v ?? "none")}
											disabled={loading}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="none">—</SelectItem>
												<SelectItem value="cash">Μετρητά</SelectItem>
												<SelectItem value="paypal">PayPal</SelectItem>
												<SelectItem value="credit_card">
													Πιστωτική Κάρτα
												</SelectItem>
												<SelectItem value="bank">Τραπεζική Μεταφορά</SelectItem>
												<SelectItem value="paid">Πληρωμένο</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="realPrice">Πραγματική Τιμή</Label>
										<Input
											id="realPrice"
											type="number"
											step="0.01"
											min="0"
											value={realPrice}
											onChange={(e) => setRealPrice(e.target.value)}
											disabled={loading}
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="declaredPrice">Δηλωθείσα Τιμή</Label>
										<Input
											id="declaredPrice"
											type="number"
											step="0.01"
											min="0"
											value={declaredPrice}
											onChange={(e) => setDeclaredPrice(e.target.value)}
											disabled={loading || declaredPriceLocked}
										/>
										{declaredPriceLocked && (
											<p className="text-xs text-muted-foreground">
												Κλειδωμένο — η κράτηση είναι ολοκληρωμένη
											</p>
										)}
									</div>
								</CardContent>
							</Card>

							{/* Ανάθεση */}
							{drivers && vehicles && partners && (
								<Card>
									<CardHeader>
										<CardTitle className="text-base text-black size-5 w-full font-semibold">
											Ανάθεση
										</CardTitle>
										<hr className="border-b-2 border-b-[#f9cf44]" />
									</CardHeader>
									<CardContent className="space-y-4">
										{isAssignmentLocked ? (
											<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
												{booking!.driverId != null ? (
													<>
														<div>
															<p className="text-xs text-muted-foreground mb-0.5">
																Οδηγός
															</p>
															<p className="text-sm font-medium">
																{drivers.find((d) => d.id === booking!.driverId)
																	?.fullName ?? "—"}
															</p>
														</div>
														<div>
															<p className="text-xs text-muted-foreground mb-0.5">
																Όχημα
															</p>
															<p className="text-sm font-medium">
																{booking!.vehicleId
																	? (() => {
																			const v = vehicles.find(
																				(v) => v.id === booking!.vehicleId,
																			);
																			return v ? `${v.name} (${v.plate})` : "—";
																		})()
																	: "—"}
															</p>
														</div>
														<div>
															<p className="text-xs text-muted-foreground mb-0.5">
																Τύπος Οχήματος
															</p>
															<p className="text-sm font-medium">
																{{
																	car: "Επιβατικό",
																	van: "Βανάκι",
																	bus: "Λεωφορείο",
																}[vehicleType] ?? vehicleType}
															</p>
														</div>
													</>
												) : booking!.partnerId != null ? (
													<>
														<div>
															<p className="text-xs text-muted-foreground mb-0.5">
																Συνεργάτης
															</p>
															<p className="text-sm font-medium">
																{partners.find(
																	(p) => p.id === booking!.partnerId
																)?.name ?? "—"}
															</p>
														</div>
														{/* <div>
															<p className="text-xs text-muted-foreground mb-0.5">
																Τιμή Ανάθεσης
															</p>
															<p className="text-sm font-medium">
																{booking!.partnerAssignmentPrice
																	? `€${parseFloat(booking!.partnerAssignmentPrice).toFixed(2)}`
																	: "—"}
															</p>
														</div> */}
													</>
												) : (
													<p className="text-sm text-muted-foreground col-span-3">
														Δεν έχει γίνει ανάθεση
													</p>
												)}
											</div>
										) : (
											<>
												<div className="flex gap-2">
													<button
														type="button"
														onClick={() => setAssignMode("driver")}
														className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
															assignMode === "driver"
																? "bg-[#f9cf44] text-[#333333]"
																: "bg-[#333333] text-[#f9cf44] hover:bg-[#f9cf44] hover:text-[#333333]"
														}`}
													>
														Οδηγός & Όχημα
													</button>
													<button
														type="button"
														onClick={() => setAssignMode("partner")}
														className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
															assignMode === "partner"
																? "bg-[#f9cf44] text-[#333333]"
																: "bg-[#333333] text-[#f9cf44] hover:bg-[#f9cf44] hover:text-[#333333]"
														}`}
													>
														Συνεργάτης
													</button>
												</div>

												{assignMode === "driver" ? (
													<div className="grid grid-cols-3 gap-4">
														<div className="space-y-2">
															<Label>Οδηγός</Label>
															<Select
																value={assignDriverId}
																onValueChange={(v) =>
																	setAssignDriverId(v ?? "")
																}
																disabled={loading}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Επιλογή οδηγού">
																		{(v) =>
																			drivers?.find((d) => String(d.id) === v)
																				?.fullName ?? v
																		}
																	</SelectValue>
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
														<div className="space-y-2">
															<Label>Όχημα</Label>
															<Select
																value={assignVehicleId}
																onValueChange={(v) =>
																	setAssignVehicleId(v ?? "")
																}
																disabled={loading}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Επιλογή οχήματος">
																		{(v) => {
																			const vh = vehicles?.find(
																				(x) => String(x.id) === v,
																			);
																			return vh
																				? vh.name + " (" + vh.plate + ")"
																				: v;
																		}}
																	</SelectValue>
																</SelectTrigger>
																<SelectContent>
																	{vehicles.map((v) => (
																		<SelectItem key={v.id} value={String(v.id)}>
																			{v.name} ({v.plate})
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</div>
														<div className="space-y-2">
															<Label>Τύπος Οχήματος *</Label>
															<Select
																value={vehicleType}
																onValueChange={(v) =>
																	setVehicleType(v ?? "car")
																}
																disabled={loading}
															>
																<SelectTrigger>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="car">Επιβατικό</SelectItem>
																	<SelectItem value="van">Βανάκι</SelectItem>
																	<SelectItem value="bus">Λεωφορείο</SelectItem>
																</SelectContent>
															</Select>
														</div>
													</div>
												) : (
													<div className="grid grid-cols-2 gap-4">
														<div className="space-y-2">
															<Label>Συνεργάτης</Label>
															<Select
																value={assignPartnerId}
																onValueChange={(v) =>
																	setAssignPartnerId(v ?? "")
																}
																disabled={loading}
															>
																<SelectTrigger>
																	<SelectValue placeholder="Επιλογή συνεργάτη">
																		{(v) =>
																			partners?.find((p) => String(p.id) === v)
																				?.name ?? v
																		}
																	</SelectValue>
																</SelectTrigger>
																<SelectContent>
																	{partners.map((p) => (
																		<SelectItem key={p.id} value={String(p.id)}>
																			{p.name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
														</div>
														<div className="space-y-2">
															<Label htmlFor="assignPartnerPrice">
																Τιμή Ανάθεσης
															</Label>
															<Input
																id="assignPartnerPrice"
																type="number"
																step="0.01"
																min="0"
																value={assignPartnerPrice}
																onChange={(e) =>
																	setAssignPartnerPrice(e.target.value)
																}
																disabled={loading}
																placeholder="0.00"
															/>
														</div>
													</div>
												)}

											
											</>
										)}
									</CardContent>
								</Card>
							)}

							{error && <p className="text-sm text-destructive">{error}</p>}
						</form>
					</div>
					<div className="flex-1 min-w-0 flex flex-col">
						{history !== undefined && (
							<div className="flex flex-col gap-6 flex-1">
								<Card className="h-[205px]">
									<CardHeader>
										<CardTitle className="text-base text-black size-5 w-full font-semibold">
											Σημειώσεις
										</CardTitle>
										<hr className="border-b-2 border-b-[#f9cf44]" />
									</CardHeader>
									<CardContent>
										<Textarea
											id="notes"
											value={notes}
											onChange={(e) => setNotes(e.target.value)}
											disabled={loading}
											rows={3}
											style={{
												height: 127,
												resize: "none",
												fieldSizing: "fixed",
											}}
										/>
									</CardContent>
								</Card>
								{history !== undefined && (
									<Card className="flex-1 overflow-auto">
										<CardHeader>
											<CardTitle className="text-base text-black size-5 w-full font-semibold">
												Ιστορικό
											</CardTitle>
											<hr className="border-b-2 border-b-[#f9cf44]" />
										</CardHeader>
										<CardContent>
											{history.length === 0 ? (
												<p className="text-sm text-muted-foreground">
													Δεν υπάρχουν εγγραφές ιστορικού
												</p>
											) : (
												<ol className="space-y-3">
													{history.map((h) => (
														<li key={h.id} className="flex gap-3 text-sm">
															<span className="text-muted-foreground whitespace-nowrap">
																{h.createdAt
																	? new Date(h.createdAt).toLocaleString(
																			"el-GR",
																			{
																				day: "2-digit",
																				month: "2-digit",
																				year: "numeric",
																				hour: "2-digit",
																				minute: "2-digit",
																			},
																		)
																	: "—"}
															</span>
															<span className="font-medium">{h.action}</span>
															{h.changes != null && (
																<span className="text-muted-foreground text-xs font-mono truncate">
																	{JSON.stringify(h.changes)}
																</span>
															)}
														</li>
													))}
												</ol>
											)}
										</CardContent>
									</Card>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
