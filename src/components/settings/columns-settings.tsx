"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ColumnPanel, { type Column } from "./column-panel";
import {
	DEFAULT_BOOKING_COLUMNS,
	loadBookingColumns,
	saveBookingColumns,
} from "@/lib/booking-columns";
import {
	DEFAULT_DRIVER_COLUMNS,
	loadDriverColumns,
	saveDriverColumns,
} from "@/lib/driver-columns";
import {
	DEFAULT_VEHICLE_COLUMNS,
	loadVehicleColumns,
	saveVehicleColumns,
} from "@/lib/vehicle-columns";

function serialize(cols: Column[]) {
	return JSON.stringify(cols.map((c) => ({ key: c.key, visible: c.visible })));
}

export default function ColumnsSettings() {
	const [bookingCols, setBookingCols] = useState<Column[]>(() => loadBookingColumns());
	const [driverCols, setDriverCols] = useState<Column[]>(() => loadDriverColumns());
	const [vehicleCols, setVehicleCols] = useState<Column[]>(() => loadVehicleColumns());

	const [savedBooking, setSavedBooking] = useState(() => serialize(loadBookingColumns()));
	const [savedDriver, setSavedDriver] = useState(() => serialize(loadDriverColumns()));
	const [savedVehicle, setSavedVehicle] = useState(() => serialize(loadVehicleColumns()));

	const isDirty =
		serialize(bookingCols) !== savedBooking ||
		serialize(driverCols) !== savedDriver ||
		serialize(vehicleCols) !== savedVehicle;

	function handleSave() {
		saveBookingColumns(bookingCols);
		saveDriverColumns(driverCols);
		saveVehicleColumns(vehicleCols);
		setSavedBooking(serialize(bookingCols));
		setSavedDriver(serialize(driverCols));
		setSavedVehicle(serialize(vehicleCols));
		toast.success("Ρυθμίσεις αποθηκεύτηκαν");
	}

	function handleReset() {
		setBookingCols(DEFAULT_BOOKING_COLUMNS);
		setDriverCols(DEFAULT_DRIVER_COLUMNS);
		setVehicleCols(DEFAULT_VEHICLE_COLUMNS);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">Ρυθμίσεις Στηλών</h1>
				<div className="flex gap-2">
					<Button size="sm" variant="outline" onClick={handleReset}>
						Επαναφορά
					</Button>
					<Button size="sm" onClick={handleSave} disabled={!isDirty}>
						Αποθήκευση
					</Button>
				</div>
			</div>

			<div className="flex gap-6 flex-wrap">
				<div className="bg-white rounded-md border border-t-4 border-t-[#f9cf44] p-6 w-72">
					<ColumnPanel
						title="Κολώνες Κρατήσεων"
						description="Σύρετε για αλλαγή σειράς · Checkbox για ορατότητα"
						columns={bookingCols}
						onChange={setBookingCols}
					/>
				</div>

				<div className="bg-white rounded-md border border-t-4 border-t-[#f9cf44] p-6 w-72">
					<ColumnPanel
						title="Κολώνες Οδηγών"
						description="Σύρετε για αλλαγή σειράς · Checkbox για ορατότητα"
						columns={driverCols}
						onChange={setDriverCols}
					/>
				</div>

				<div className="bg-white rounded-md border border-t-4 border-t-[#f9cf44] p-6 w-72">
					<ColumnPanel
						title="Κολώνες Οχημάτων"
						description="Σύρετε για αλλαγή σειράς · Checkbox για ορατότητα"
						columns={vehicleCols}
						onChange={setVehicleCols}
					/>
				</div>
			</div>
		</div>
	);
}
