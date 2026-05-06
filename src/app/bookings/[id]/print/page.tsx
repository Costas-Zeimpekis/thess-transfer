import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, providers, drivers, vehicles, partners } from "@/lib/db/schema";
import PrintActions from "./print-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	const bookingId = parseInt(id, 10);
	if (Number.isNaN(bookingId)) return { title: "Κράτηση" };

	const rows = await db
		.select({
			id: bookings.id,
			customerName: bookings.customerName,
			pickupDatetime: bookings.pickupDatetime,
			providerBookingRef: bookings.providerBookingRef,
		})
		.from(bookings)
		.where(eq(bookings.id, bookingId))
		.limit(1);

	const b = rows[0];
	if (!b) return { title: "Κράτηση" };

	const date = new Date(b.pickupDatetime).toLocaleDateString("el-GR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
	const ref = b.providerBookingRef ?? `#${b.id}`;
	const title = `${ref} - ${b.customerName} - ${date}`;

	return { title };
}

const STATUS_LABELS: Record<string, string> = {
	pending: "Εκκρεμής",
	confirmed: "Επιβεβαιωμένη",
	completed: "Ολοκληρωμένη",
	cancelled: "Ακυρωμένη",
};

const STATUS_COLORS: Record<string, string> = {
	pending: "bg-amber-100 text-amber-800 border-amber-300",
	confirmed: "bg-blue-100 text-blue-800 border-blue-200",
	completed: "bg-green-100 text-green-800 border-green-200",
	cancelled: "bg-red-100 text-red-800 border-red-200",
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

function fmt(val: string | null) {
	return val != null ? `€${parseFloat(val).toFixed(2)}` : "—";
}

function fmtDatetime(val: Date | string | null) {
	if (!val) return "—";
	return new Date(val).toLocaleString("el-GR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
}

type PageProps = { params: Promise<{ id: string }> };

export default async function BookingPrintPage({ params }: PageProps) {
	const session = await getSession();
	if (!session) redirect("/login");

	const { id } = await params;
	const bookingId = parseInt(id, 10);
	if (Number.isNaN(bookingId)) notFound();

	const rows = await db
		.select({
			id: bookings.id,
			providerBookingRef: bookings.providerBookingRef,
			status: bookings.status,
			source: bookings.source,
			pickupDatetime: bookings.pickupDatetime,
			flightNumber: bookings.flightNumber,
			pickupLocation: bookings.pickupLocation,
			dropoffLocation: bookings.dropoffLocation,
			passengerCount: bookings.passengerCount,
			vehicleType: bookings.vehicleType,
			babySeat: bookings.babySeat,
			boosterSeat: bookings.boosterSeat,
			customerName: bookings.customerName,
			customerPhone: bookings.customerPhone,
			customerEmail: bookings.customerEmail,
			paymentMethod: bookings.paymentMethod,
			notes: bookings.notes,
			realPrice: bookings.realPrice,
			declaredPrice: bookings.declaredPrice,
			partnerAssignmentPrice: bookings.partnerAssignmentPrice,
			driverId: bookings.driverId,
			vehicleId: bookings.vehicleId,
			partnerId: bookings.partnerId,
			createdAt: bookings.createdAt,
			providerName: providers.name,
			driverName: drivers.fullName,
			vehicleName: vehicles.name,
			vehiclePlate: vehicles.plate,
			partnerName: partners.name,
		})
		.from(bookings)
		.leftJoin(providers, eq(bookings.providerId, providers.id))
		.leftJoin(drivers, eq(bookings.driverId, drivers.id))
		.leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
		.leftJoin(partners, eq(bookings.partnerId, partners.id))
		.where(eq(bookings.id, bookingId))
		.limit(1);

	if (!rows[0]) notFound();
	const b = rows[0];

	const isPartnerAssigned = b.partnerId != null;
	const priceDiff =
		b.realPrice != null && b.declaredPrice != null
			? parseFloat(b.realPrice) - parseFloat(b.declaredPrice)
			: null;

	return (
		<div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0">
			<div className="max-w-3xl mx-auto bg-white shadow-md print:shadow-none p-10 print:p-8">
				<PrintActions />

				{/* Header */}
				<div className="flex items-start justify-between mb-8 pb-6 border-b-4 border-[#f9cf44]">
					<div>
						<p className="text-2xl font-extrabold tracking-tight text-[#333333]">THESS TRANSFERS</p>
						<p className="text-sm text-muted-foreground mt-1">Μεταφορές — Θεσσαλονίκη</p>
					</div>
					<div className="text-right">
						<p className="text-3xl font-extrabold text-[#333333]">#{b.id}</p>
						{b.providerBookingRef && (
							<p className="text-sm text-muted-foreground font-mono mt-0.5">Ref: {b.providerBookingRef}</p>
						)}
						<span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded border ${STATUS_COLORS[b.status] ?? ""}`}>
							{STATUS_LABELS[b.status] ?? b.status}
						</span>
					</div>
				</div>

				{/* Transport Details */}
				<Section title="Στοιχεία Μεταφοράς">
					<div className="grid grid-cols-2 gap-x-8 gap-y-3">
						<Field label="Ημ/νία Παραλαβής" value={fmtDatetime(b.pickupDatetime)} />
						<Field label="Αριθμός Πτήσης" value={b.flightNumber ?? "—"} />
						<Field label="Σημείο Παραλαβής" value={b.pickupLocation} />
						<Field label="Προορισμός" value={b.dropoffLocation} />
					</div>
				</Section>

				{/* Passengers & Vehicle */}
				<Section title="Επιβάτες & Όχημα">
					<div className="grid grid-cols-4 gap-x-8 gap-y-3">
						<Field label="Επιβάτες" value={String(b.passengerCount)} />
						<Field label="Τύπος Οχήματος" value={isPartnerAssigned ? "—" : (VEHICLE_TYPE_LABELS[b.vehicleType] ?? b.vehicleType)} />
						<Field label="Baby Seat" value={b.babySeat ? String(b.babySeat) : "0"} />
						<Field label="Booster Seat" value={b.boosterSeat ? String(b.boosterSeat) : "0"} />
					</div>
				</Section>

				{/* Customer */}
				<Section title="Στοιχεία Πελάτη">
					<div className="grid grid-cols-3 gap-x-8 gap-y-3">
						<Field label="Ονοματεπώνυμο" value={b.customerName} />
						<Field label="Τηλέφωνο" value={b.customerPhone ?? "—"} />
						<Field label="Email" value={b.customerEmail ?? "—"} />
					</div>
				</Section>

				{/* Assignment */}
				<Section title="Ανάθεση">
					{isPartnerAssigned ? (
						<div className="grid grid-cols-2 gap-x-8 gap-y-3">
							<Field label="Συνεργάτης" value={b.partnerName ?? "—"} />
							<Field label="Τιμή Συνεργάτη" value={fmt(b.partnerAssignmentPrice)} />
						</div>
					) : (
						<div className="grid grid-cols-2 gap-x-8 gap-y-3">
							<Field label="Οδηγός" value={b.driverName ?? "—"} />
							<Field label="Όχημα" value={b.vehicleName ? `${b.vehicleName} (${b.vehiclePlate})` : "—"} />
						</div>
					)}
				</Section>

				{/* Financials */}
				<Section title="Οικονομικά">
					<div className="grid grid-cols-4 gap-x-8 gap-y-3">
						<Field label="Πραγματική Τιμή" value={fmt(b.realPrice)} />
						<Field label="Δηλωθείσα Τιμή" value={fmt(b.declaredPrice)} />
						<Field
							label="Διαφορά"
							value={priceDiff != null ? `€${priceDiff.toFixed(2)}` : "—"}
							valueClass={priceDiff != null && priceDiff < 0 ? "text-red-600 font-semibold" : ""}
						/>
						<Field label="Τρόπος Πληρωμής" value={b.paymentMethod ? (PAYMENT_METHOD_LABELS[b.paymentMethod] ?? b.paymentMethod) : "—"} />
					</div>
				</Section>

				{/* Notes */}
				{b.notes && (
					<Section title="Σημειώσεις">
						<p className="text-sm text-[#333333] whitespace-pre-wrap">{b.notes}</p>
					</Section>
				)}

				{/* Footer */}
				<div className="mt-10 pt-4 border-t border-gray-200 flex justify-between text-xs text-muted-foreground">
					<span>Πάροχος: {b.providerName ?? "—"} · {b.source === "manual" ? "Χειροκίνητη Κράτηση" : "Αυτόματη Κράτηση"}</span>
					<span>Δημιουργήθηκε: {fmtDatetime(b.createdAt)}</span>
				</div>
			</div>
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="mb-6">
			<p className="text-[10px] font-bold uppercase tracking-widest text-[#333333] border-b-2 border-[#f9cf44] pb-1 mb-3">
				{title}
			</p>
			{children}
		</div>
	);
}

function Field({ label, value, valueClass = "" }: { label: string; value: string; valueClass?: string }) {
	return (
		<div>
			<p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
			<p className={`text-sm font-medium text-[#333333] ${valueClass}`}>{value}</p>
		</div>
	);
}
