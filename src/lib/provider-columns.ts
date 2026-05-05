export type ProviderColumn = {
	key: string;
	label: string;
	visible: boolean;
};

export const DEFAULT_PROVIDER_COLUMNS: ProviderColumn[] = [
	{ key: "name", label: "Όνομα", visible: true },
	{ key: "slug", label: "Slug", visible: true },
	{ key: "taxId", label: "ΑΦΜ", visible: true },
	{ key: "emails", label: "Emails", visible: true },
];

const LS_KEY = "provider_columns_v1";

export function loadProviderColumns(): ProviderColumn[] {
	if (typeof window === "undefined") return DEFAULT_PROVIDER_COLUMNS;
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return DEFAULT_PROVIDER_COLUMNS;
		const saved: ProviderColumn[] = JSON.parse(raw);
		const savedKeys = new Set(saved.map((c) => c.key));
		const newCols = DEFAULT_PROVIDER_COLUMNS.filter((c) => !savedKeys.has(c.key));
		return [...saved, ...newCols];
	} catch {
		return DEFAULT_PROVIDER_COLUMNS;
	}
}

export function saveProviderColumns(cols: ProviderColumn[]): void {
	localStorage.setItem(LS_KEY, JSON.stringify(cols));
}
