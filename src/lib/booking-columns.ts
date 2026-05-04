export type BookingColumn = {
	key: string;
	label: string;
	visible: boolean;
};

export const DEFAULT_BOOKING_COLUMNS: BookingColumn[] = [
	{ key: "createdAt", label: "Ημ/νία Κράτησης", visible: true },
	{ key: "providerName", label: "Πάροχος", visible: true },
	{ key: "providerBookingRef", label: "Ref Παρόχου", visible: true },
	{ key: "pickupDatetime", label: "Ημ/νία Παραλαβής", visible: true },
	{ key: "assignment", label: "Ανάθεση", visible: true },
	{ key: "vehicleType", label: "Τύπος Οχήματος", visible: true },
	{ key: "vehicleName", label: "Όχημα", visible: true },
	{ key: "customerName", label: "Πελάτης", visible: true },
	{ key: "status", label: "Κατάσταση", visible: true },
	{ key: "paymentMethod", label: "Τρόπος Πληρωμής", visible: true },
	{ key: "realPrice", label: "Πραγματική", visible: true },
	{ key: "declaredPrice", label: "Δηλωθείσα", visible: true },
	{ key: "priceDiff", label: "Διαφορά", visible: true },
];

const LS_KEY = "booking_columns_v1";

export function loadBookingColumns(): BookingColumn[] {
	if (typeof window === "undefined") return DEFAULT_BOOKING_COLUMNS;
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return DEFAULT_BOOKING_COLUMNS;
		const saved: BookingColumn[] = JSON.parse(raw);
		const savedKeys = new Set(saved.map((c) => c.key));
		const newCols = DEFAULT_BOOKING_COLUMNS.filter((c) => !savedKeys.has(c.key));
		return [...saved, ...newCols];
	} catch {
		return DEFAULT_BOOKING_COLUMNS;
	}
}

export function saveBookingColumns(cols: BookingColumn[]): void {
	localStorage.setItem(LS_KEY, JSON.stringify(cols));
}
