export type MicroExpenseColumn = {
	key: string;
	label: string;
	visible: boolean;
};

export const DEFAULT_MICRO_EXPENSE_COLUMNS: MicroExpenseColumn[] = [
	{ key: "driverName", label: "Οδηγός", visible: true },
	{ key: "reason", label: "Κατηγορία", visible: true },
	{ key: "price", label: "Ποσό", visible: true },
	{ key: "description", label: "Περιγραφή", visible: true },
];

const LS_KEY = "micro_expense_columns_v1";

export function loadMicroExpenseColumns(): MicroExpenseColumn[] {
	if (typeof window === "undefined") return DEFAULT_MICRO_EXPENSE_COLUMNS;
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return DEFAULT_MICRO_EXPENSE_COLUMNS;
		const saved: MicroExpenseColumn[] = JSON.parse(raw);
		const savedKeys = new Set(saved.map((c) => c.key));
		const newCols = DEFAULT_MICRO_EXPENSE_COLUMNS.filter((c) => !savedKeys.has(c.key));
		return [...saved, ...newCols];
	} catch {
		return DEFAULT_MICRO_EXPENSE_COLUMNS;
	}
}

export function saveMicroExpenseColumns(cols: MicroExpenseColumn[]): void {
	localStorage.setItem(LS_KEY, JSON.stringify(cols));
}
