export type PartnerColumn = {
	key: string;
	label: string;
	visible: boolean;
};

export const DEFAULT_PARTNER_COLUMNS: PartnerColumn[] = [
	{ key: "name", label: "Επωνυμία", visible: true },
	{ key: "taxId", label: "ΑΦΜ", visible: true },
	{ key: "email", label: "Email", visible: true },
	{ key: "phone", label: "Τηλέφωνο", visible: true },
	{ key: "contactInfo", label: "Στοιχεία Επικοινωνίας", visible: true },
];

const LS_KEY = "partner_columns_v1";

export function loadPartnerColumns(): PartnerColumn[] {
	if (typeof window === "undefined") return DEFAULT_PARTNER_COLUMNS;
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return DEFAULT_PARTNER_COLUMNS;
		const saved: PartnerColumn[] = JSON.parse(raw);
		const savedKeys = new Set(saved.map((c) => c.key));
		const newCols = DEFAULT_PARTNER_COLUMNS.filter((c) => !savedKeys.has(c.key));
		return [...saved, ...newCols];
	} catch {
		return DEFAULT_PARTNER_COLUMNS;
	}
}

export function savePartnerColumns(cols: PartnerColumn[]): void {
	localStorage.setItem(LS_KEY, JSON.stringify(cols));
}
