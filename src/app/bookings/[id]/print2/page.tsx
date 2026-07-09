import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { bookings, drivers, vehicles, partners } from "@/lib/db/schema";
import PrintActions from "../print/print-actions";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params;
	const bookingId = parseInt(id, 10);
	if (Number.isNaN(bookingId)) return { title: "Μισθωτήριο Συμβόλαιο" };

	const rows = await db
		.select({ id: bookings.id, customerName: bookings.customerName })
		.from(bookings)
		.where(eq(bookings.id, bookingId))
		.limit(1);

	const b = rows[0];
	if (!b) return { title: "Μισθωτήριο Συμβόλαιο" };
	return { title: `Μισθωτήριο Συμβόλαιο — ${b.customerName} #${b.id}` };
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
	cash: "Μετρητά / Cash",
	paypal: "PayPal",
	credit_card: "Πιστωτική Κάρτα / Credit Card",
	bank: "Τράπεζα / Bank Transfer",
	paid: "Πληρωμένο / Paid",
};

const TZ = "Europe/Athens";

function fmtDate(val: Date | string | null) {
	if (!val) return "—";
	return new Date(val).toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
}

function fmtTime(val: Date | string | null) {
	if (!val) return "—";
	return new Date(val).toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
}

function fmtIssueDatetime(val: Date | string | null) {
	if (!val) return "—";
	const d = new Date(val);
	const date = d.toLocaleDateString("el-GR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
	const time = d.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: TZ });
	return `${date} ${time}`;
}

function calcDurationHours(start: Date | string | null, end: Date | string | null): string {
	if (!start || !end) return "—";
	const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
	if (diff <= 0) return "—";
	const h = Math.floor(diff / 60);
	const m = Math.round(diff % 60);
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
			assignedAt: bookings.assignedAt,
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

	const startDate = fmtDate(b.startTime ?? b.arrivalDatetime);
	const endDate = fmtDate(b.endTime ?? b.arrivalDatetime);
	const duration = calcDurationHours(b.startTime, b.endTime);
	const issuedAt = fmtIssueDatetime(b.assignedAt ?? b.createdAt);
	const price = b.declaredPrice ? `${parseFloat(b.declaredPrice).toFixed(2)}` : "—";
	const payment = PAYMENT_METHOD_LABELS[b.paymentMethod ?? ""] ?? (b.paymentMethod ?? "—");

	return (
		<div className="min-h-screen bg-gray-100 print:bg-white py-8 print:py-0">
			<div className="max-w-4xl mx-auto bg-white shadow-md print:shadow-none p-10 print:p-8">
				<PrintActions />

				{/* Header */}
				<div className="flex items-start justify-between mb-5 pb-4 border-b border-gray-300">
					{/* Left: Brand logo */}
					<div className="flex items-end gap-3">
						<span className="text-5xl font-black tracking-tight text-[#333333] leading-none">SALONICA</span>
						<div className="flex flex-col leading-tight mb-0.5">
							<span className="text-xl font-bold text-[#333333] tracking-wide">TRAVEL</span>
							<span className="text-xl font-bold text-[#333333] tracking-wide">SERVICES</span>
						</div>
					</div>
					{/* Right: Legal entity + contact */}
					<div className="text-right text-[10px] leading-snug text-[#333333]">
						<p className="font-bold text-[11px] mb-0.5">ΜΕΝΗ ΡΑΠΤΗ &amp; ΣΙΑ Ο.Ε.</p>
						<p>New Railway Station Of Thessaloniki</p>
						<p>Tel.: +30 2310 525050, Fax: +30 2310 552952</p>
						<p>Web: www.transfersthessaloniki.com</p>
						<p>E-mail: info@transfersthessaloniki.com</p>
					</div>
				</div>

				{/* Contract title */}
				<div className="border-2 border-[#333333] rounded-sm px-6 py-3 text-center mb-8 mx-16">
					<p className="text-lg font-extrabold tracking-widest text-[#333333] uppercase">ΜΙΣΘΩΤΗΡΙΟ ΣΥΜΒΟΛΑΙΟ</p>
					<p className="text-sm font-semibold tracking-widest text-[#555555] uppercase">RENTAL CONTRACT</p>
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
							<ContractField labelGr="ΩΡΑ ΕΝΑΡΞΗΣ" labelEn="START TIME" value={fmtTime(b.startTime)} />
						</div>
						<div className="grid grid-cols-2 gap-4">
							<ContractField labelGr="ΗΜ/ΝΙΑ ΛΗΞΗΣ" labelEn="END DATE" value={endDate} />
							<ContractField labelGr="ΩΡΑ ΛΗΞΗΣ" labelEn="END TIME" value={fmtTime(b.endTime)} />
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
						<ContractField labelGr="ΣΗΜΕΙΟ ΕΝΑΡΞΗΣ" labelEn="START LOCATION" value="ΕΔΡΑ ΜΑΣ (ΜΟΝΑΣΤΗΡΙΟΥ 28)" />
						<ContractField labelGr="ΣΗΜΕΙΟ ΕΠΙΒΙΒΑΣΗΣ" labelEn="PICK UP LOCATION" value={b.pickupLocation} />
						<ContractField labelGr="ΑΝΤΙΤΙΜΟ" labelEn="PRICE €" value={price} />
						<ContractField labelGr="ΤΡΟΠΟΣ ΠΛΗΡΩΜΗΣ" labelEn="WAY OF PAYMENT" value={payment} />
					</div>
				</div>

				{/* Consent text */}
				<div className="mb-6 text-[8px] leading-relaxed text-[#555555] border-t border-gray-200 pt-4">
					<p className="font-bold mb-1">Συγκατάθεση πελάτη</p>
					<p>Όπως ορίζεται στο άρθρο 4 παρ. 2 εδάφ. α&apos; της ΚΥΑ 43618/1925 (ΦΕΚ Β&apos; 2251/11.06.2019), επιβεβαιώνω πως έχω ενημερωθεί για τα προαναγραφόμενα στοιχεία της σύμβασης που με αφορούν, καταχωρούνται στο Ψηφιακό Μητρώο που τηρείται στο Υπουργείο Υποδομών και Μεταφορών. Τα σύνολο των δεδομένων μου προσωπικού χαρακτήρα (ονοματεπώνυμο, στοιχεία ταυτότητας ή διαβατηρίου, σημείο επιβίβασης) διαγράφονται εντός είκοσι τεσσάρων (24) ωρών από τη λήξη της σύμβασης.</p>
					<p className="mt-1 font-bold">Customer Consent</p>
					<p>As defined in article 4 paragraph 2 subparagraph &quot;a&quot; of Ministerial Decision 43618/1925 (Government Gazette B&quot; 2251/11.06.2019), I confirm that I have been informed that my personal data mentioned herein are registered in the Digital Platform of the Ministry of Infrastructure and Transportation. All my personal data (name, identification or passport details, pick-up location) are deleted within twenty four (24) hours after the end of this contract.</p>
				</div>

				{/* Signature section */}
				<div className="pt-4 border-t-2 border-[#f9cf44]">
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
				<div className="mt-4 pt-3 border-t border-gray-200 text-[9px] text-muted-foreground text-center">
					<span>ΜΕΝΗ ΡΑΠΤΗ &amp; ΣΙΑ Ο.Ε. · SALONICA TRAVEL SERVICES · New Railway Station Of Thessaloniki · Tel.: +30 2310 525050</span>
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
