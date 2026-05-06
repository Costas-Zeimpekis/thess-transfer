"use client";

export default function PrintActions() {
	return (
		<div className="print:hidden mb-6 flex justify-end gap-2">
			<button
				onClick={() => window.print()}
				className="inline-flex items-center gap-2 rounded-md bg-[#333333] px-4 py-2 text-sm font-medium text-[#f9cf44] hover:bg-[#3d3d3d] transition-colors"
			>
				Εκτύπωση / Αποθήκευση PDF
			</button>
		</div>
	);
}
