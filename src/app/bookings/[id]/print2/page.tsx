import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, providers, drivers, vehicles, partners } from "@/lib/db/schema";
import PrintActions from "../print/print-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	const bookingId = parseInt(id, 10);
	if (Number.isNaN(bookingId)) return { title: "Σύμβαση Μίσθωσης" };

	const rows = await db
		.select({ id: bookings.id, customerName: bookings.customerName })
		.from(bookings)
		.where(eq(bookings.id, bookingId))
		.limit(1);

	const b = rows[0];
	if (!b) return { title: "Σύμβαση Μίσθωσης" };
	return { title: `Σύμβαση Μίσθωσης — ${b.customerName} #${b.id}` };
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	cash: "Μετρητά / Cash",
	paypal: "PayPal",
	credit_card: "Πιστωτική Κάρτα / Credit Card",
	bank: "Τράπεζα / Bank Transfer",
	paid: "Πληρωμένο / Paid",
};

function fmtDate(val: Date | string | null) {
	if (!val) return "—";
	return new Date(val).toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtIssueDatetime(val: Date | string | null) {
	if (!val) return "—";
	const d = new Date(val);
	const date = d.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric" });
	const time = d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit", hour12: false });
	return `${date} ${time}`;
}

function calcDurationHours(start: string | null, end: string | null): string {
	if (!start || !end) return "—";
	const [sh, sm] = start.split(":").map(Number);
	const [eh, em] = end.split(":").map(Number);
	if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return "—";
	const diff = (eh * 60 + em) - (sh * 60 + sm);
	if (diff <= 0) return "—";
	const h = Math.floor(diff / 60);
	const m = diff % 60;
	return m === 0 ? String(h) : `${h}h ${m}m`;
}

type PageProps = { params: Promise<{ id: string }> };

export default async function BookingContractPrintPage({ params }: PageProps) {
	const session = await getSession();
	if (!session) redirect("/login");

	const { id } = await params;
	const bookingId = parseInt(id, 10);
	if (Number.isNaN(bookingId)) notFound();

	const rows = await db
		.select({
			id: bookings.id,
			providerBookingRef: bookings.providerBookingRef,
			arrivalDatetime: bookings.arrivalDatetime,
			startTime: bookings.startTime,
			endTime: bookings.endTime,
			pickupLocation: bookings.pickupLocation,
			dropoffLocation: bookings.dropoffLocation,
			passengerCount: bookings.passengerCount,
			customerName: bookings.customerName,
			paymentMethod: bookings.paymentMethod,
			declaredPrice: bookings.declaredPrice,
			driverId: bookings.driverId,
			vehicleId: bookings.vehicleId,
			partnerId: bookings.partnerId,
			createdAt: bookings.createdAt,
			driverName: drivers.fullName,
			driverIdCard: drivers.idCard,
			driverLicense: drivers.driversLicense,
			driverTaxId: drivers.taxId,
			vehicleName: vehicles.name,
			vehiclePlate: vehicles.plate,
			partnerName: partners.name,
		})
		.from(bookings)
		.leftJoin(drivers, eq(bookings.driverId, drivers.id))
		.leftJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
		.leftJoin(partners, eq(bookings.partnerId, partners.id))
		.where(eq(bookings.id, bookingId))
		.limit(1);

	if (!rows[0]) notFound();
	const b = rows[0];

	const startDate = fmtDate(b.arrivalDatetime);
	const endDate = fmtDate(b.arrivalDatetime);
	const duration = calcDurationHours(b.startTime, b.endTime);
	const issuedAt = fmtIssueDatetime(b.createdAt);
	const price = b.declaredPrice ? `${parseFloat(b.declaredPrice).toFixed(2)}` : "—";
	const payment = PAYMENT_METHOD_LABELS[b.paymentMethod ?? ""] ?? (b.paymentMethod ?? "—");
	const vehicle = b.vehicleName && b.vehiclePlate ? `${b.vehicleName} (${b.vehiclePlate})` : (b.vehicleName ?? "—");

	return (
		<div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0">
			<div className="max-w-4xl mx-auto bg-white shadow-md print:shadow-none p-10 print:p-8">
				<PrintActions />

				{/* Header */}
				<div className="flex items-start justify-between mb-4 pb-4 border-b-4 border-[#f9cf44]">
					<div>
						<p className="text-2xl font-extrabold tracking-tight text-[#333333]">THESS TRANSFERS</p>
						<p className="text-sm text-muted-foreground mt-1">Μεταφορές — Θεσσαλονίκη</p>
					</div>
					<div className="text-right">
						<p className="text-3xl font-extrabold text-[#333333]">#{b.id}</p>
						{b.providerBookingRef && (
							<p className="text-sm text-muted-foreground font-mono mt-0.5">Ref: {b.providerBookingRef}</p>
						)}
					</div>
				</div>

				{/* Contract title */}
				<div className="text-center mb-8">
					<p className="text-xl font-extrabold tracking-widest text-[#333333] uppercase">ΣΥΜΒΑΣΗ ΜΙΣΘΩΣΗΣ ΟΧΗΜΑΤΟΣ</p>
					<p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase mt-0.5">VEHICLE RENTAL AGREEMENT</p>
				</div>

				{/* Two-column contract fields */}
				<div className="grid grid-cols-2 gap-x-10 mb-8">
					{/* Left Column */}
					<div className="space-y-4 border-r border-gray-200 pr-8">
						<ContractField labelGr="ΟΧΗΜΑ" labelEn="VEHICLE" value={b.vehicleName ?? "—"} />
						<ContractField labelGr="ΑΡ. ΚΥΚΛΟΦΟΡΙΑΣ" labelEn="REG. NUMBER" value={b.vehiclePlate ?? "—"} />
						<ContractField labelGr="ΟΝΟΜΑ ΟΔΗΓΟΥ" labelEn="DRIVER'S NAME" value={b.driverName ?? "—"} />
						<ContractField labelGr="ΣΤΟΙΧΕΙΑ Α.Τ." labelEn="I.D. CARD NO." value={b.driverIdCard ?? "—"} />
						<ContractField labelGr="ΑΡΙΘΜΟΣ ΑΔΕΙΑΣ" labelEn="LICENCE NO." value={b.driverLicense ?? "—"} />
						<ContractField labelGr="ΑΦΜ" labelEn="VAT" value={b.driverTaxId ?? "—"} />
						<div className="grid grid-cols-2 gap-4">
							<ContractField labelGr="ΗΜ/ΝΙΑ ΕΝΑΡΞΗΣ" labelEn="START DATE" value={startDate} />
							<ContractField labelGr="ΩΡΑ ΕΝΑΡΞΗΣ" labelEn="START TIME" value={b.startTime ?? "—"} />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<ContractField labelGr="ΗΜ/ΝΙΑ ΛΗΞΗΣ" labelEn="END DATE" value={endDate} />
							<ContractField labelGr="ΩΡΑ ΛΗΞΗΣ" labelEn="END TIME" value={b.endTime ?? "—"} />
						</div>
						<ContractField labelGr="ΣΥΝΟΛΙΚΗ ΔΙΑΡΚΕΙΑ ΜΙΣΘΩΣΗΣ" labelEn="TOTAL DURATION OF RENTAL" value={duration} />
						<ContractField labelGr="ΗΜ/ΝΙΑ, ΩΡΑ ΚΑΤΑΡΤΙΣΗΣ" labelEn="DATE, TIME OF ISSUE" value={issuedAt} />
					</div>

					{/* Right Column */}
					<div className="space-y-4 pl-2">
						<ContractField labelGr="ΟΝΟΜΑ ΠΕΛΑΤΗ" labelEn="CUSTOMER NAME" value={b.customerName} />
						<ContractField labelGr="ΑΡ. ΔΙΑΒΑΤΗΡΙΟΥ / ΤΑΥΤΟΤΗΤΑΣ" labelEn="PASSPORT / I.D. CARD NUMBER" value="—" />
						<ContractField
							labelGr="ΑΤΟΜΑ"
							labelEn="PAX"
							value={String(b.passengerCount)}
							note="Η σύμβαση μίσθωσης ισχύει για τους παρακάτω επιβάτες / Rental agreement is valid for the following passengers"
						/>
						<ContractField labelGr="ΣΗΜΕΙΟ ΕΝΑΡΞΗΣ" labelEn="START LOCATION" value={b.dropoffLocation} />
						<ContractField labelGr="ΣΗΜΕΙΟ ΕΠΙΒΙΒΑΣΗΣ" labelEn="PICK UP LOCATION" value={b.pickupLocation} />
						<ContractField labelGr="ΑΝΤΙΤΙΜΟ" labelEn="PRICE €" value={price} />
						<ContractField labelGr="ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ" labelEn="WAY OF PAYMENT" value={payment} />
					</div>
				</div>

				{/* Signature section */}
				<div className="mt-8 pt-6 border-t-2 border-[#f9cf44]">
					<div className="grid grid-cols-2 gap-x-10">
						<div>
							<p className="text-[10px] font-bold uppercase tracking-widest text-[#333333] mb-1">
								ΥΠΟΓΡΑΦΗ ΠΕΛΑΤΗ — CUSTOMER SIGNATURE
							</p>
							<div className="h-20 border border-gray-300 rounded" />
						</div>
						<div>
							<p className="text-[10px] font-bold uppercase tracking-widest text-[#333333] mb-1">
								ΥΠΟΓΡΑΦΗ ΟΔΗΓΟΥ — DRIVER SIGNATURE
							</p>
							<div className="h-20 border border-gray-300 rounded" />
						</div>
					</div>
				</div>

				{/* Footer */}
				<div className="mt-6 pt-3 border-t border-gray-200 text-xs text-muted-foreground text-center">
					<span>THESS TRANSFERS · Θεσσαλονίκη</span>
				</div>
			</div>
		</div>
	);
}

function ContractField({
	labelGr,
	labelEn,
	value,
	note,
}: {
	labelGr: string;
	labelEn: string;
	value: string;
	note?: string;
}) {
	return (
		<div className="border-b border-gray-200 pb-2">
			<p className="text-[9px] font-bold uppercase tracking-wide text-[#333333]">
				{labelGr} / <span className="font-normal text-muted-foreground">{labelEn}</span>
			</p>
			{note && <p className="text-[8px] text-muted-foreground italic mb-0.5">{note}</p>}
			<p className="text-sm font-semibold text-[#333333] mt-0.5">{value}</p>
		</div>
	);
}
