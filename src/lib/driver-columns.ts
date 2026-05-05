export type DriverColumn = {
	key: string;
	label: string;
	visible: boolean;
};

export const DEFAULT_DRIVER_COLUMNS: DriverColumn[] = [
	{ key: "fullName", label: "Ονοματεπώνυμο", visible: true },
	{ key: "driversLicense", label: "Δίπλωμα Οδήγησης", visible: true },
	{ key: "taxId", label: "ΑΦΜ", visible: true },
	{ key: "phone", label: "Τηλέφωνο", visible: true },
	{ key: "email", label: "Email", visible: true },
	{ key: "active", label: "Κατάσταση", visible: true },
];

const LS_KEY = "driver_columns_v1";

export function loadDriverColumns(): DriverColumn[] {
	if (typeof window === "undefined") return DEFAULT_DRIVER_COLUMNS;
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return DEFAULT_DRIVER_COLUMNS;
		const saved: DriverColumn[] = JSON.parse(raw);
		const savedKeys = new Set(saved.map((c) => c.key));
		const newCols = DEFAULT_DRIVER_COLUMNS.filter((c) => !savedKeys.has(c.key));
		return [...saved, ...newCols];
	} catch {
		return DEFAULT_DRIVER_COLUMNS;
	}
}

export function saveDriverColumns(cols: DriverColumn[]): void {
	localStorage.setItem(LS_KEY, JSON.stringify(cols));
}
