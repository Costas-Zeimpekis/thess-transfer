export type VehicleColumn = {
	key: string;
	label: string;
	visible: boolean;
};

export const DEFAULT_VEHICLE_COLUMNS: VehicleColumn[] = [
	{ key: "name", label: "Όνομα", visible: true },
	{ key: "plate", label: "Πινακίδα", visible: true },
	{ key: "type", label: "Τύπος", visible: true },
	{ key: "brand", label: "Μάρκα", visible: true },
	{ key: "active", label: "Κατάσταση", visible: true },
];

const LS_KEY = "vehicle_columns_v1";

export function loadVehicleColumns(): VehicleColumn[] {
	if (typeof window === "undefined") return DEFAULT_VEHICLE_COLUMNS;
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return DEFAULT_VEHICLE_COLUMNS;
		const saved: VehicleColumn[] = JSON.parse(raw);
		const savedKeys = new Set(saved.map((c) => c.key));
		const newCols = DEFAULT_VEHICLE_COLUMNS.filter((c) => !savedKeys.has(c.key));
		return [...saved, ...newCols];
	} catch {
		return DEFAULT_VEHICLE_COLUMNS;
	}
}

export function saveVehicleColumns(cols: VehicleColumn[]): void {
	localStorage.setItem(LS_KEY, JSON.stringify(cols));
}
