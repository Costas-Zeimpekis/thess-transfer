"use client";

import dynamic from "next/dynamic";
import Navigation from "@/components/ui/navigation";

const ColumnsSettings = dynamic(
	() => import("@/components/settings/columns-settings"),
	{ ssr: false },
);

export default function SettingsPage() {
	return (
		<div className="bg-white p-6 flex flex-col gap-6 flex-1 min-h-0 overflow-auto">
			<Navigation />
			<ColumnsSettings />
		</div>
	);
}
