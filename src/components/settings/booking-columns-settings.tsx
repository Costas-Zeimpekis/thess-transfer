"use client";

import { useState } from "react";
import { GripVertical } from "lucide-react";
import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
	DEFAULT_BOOKING_COLUMNS,
	loadBookingColumns,
	saveBookingColumns,
	type BookingColumn,
} from "@/lib/booking-columns";

function SortableColumn({
	col,
	onToggle,
}: {
	col: BookingColumn;
	onToggle: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: col.key });

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-md border select-none transition-shadow ${isDragging ? "shadow-lg opacity-90 z-50" : ""
				}`}
		>
			<button
				type="button"
				{...attributes}
				{...listeners}
				className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
			>
				<GripVertical size={16} />
			</button>
			<span className="flex-1 text-sm">{col.label}</span>
			<Checkbox
				id={`col-${col.key}`}
				checked={col.visible}
				onCheckedChange={onToggle}
			/>
		</div>
	);
}

function serialize(cols: BookingColumn[]) {
	return JSON.stringify(cols.map((c) => ({ key: c.key, visible: c.visible })));
}

export default function BookingColumnsSettings() {
	const [columns, setColumns] = useState<BookingColumn[]>(() => loadBookingColumns());
	const [savedSnapshot, setSavedSnapshot] = useState(() => serialize(loadBookingColumns()));

	const isDirty = serialize(columns) !== savedSnapshot;

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		setColumns((cols) => {
			const oldIndex = cols.findIndex((c) => c.key === active.id);
			const newIndex = cols.findIndex((c) => c.key === over.id);
			return arrayMove(cols, oldIndex, newIndex);
		});
	}

	function handleToggle(key: string) {
		setColumns((cols) =>
			cols.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)),
		);
	}

	function handleSave() {
		saveBookingColumns(columns);
		setSavedSnapshot(serialize(columns));
		toast.success("Ρυθμίσεις αποθηκεύτηκαν");
	}

	function handleReset() {
		setColumns(DEFAULT_BOOKING_COLUMNS);
	}

	return (
		<div className="bg-white rounded-md border border-t-4 border-t-[#f9cf44] p-6 space-y-4 max-w-sm">
			<div>
				<h2 className="font-semibold text-base">Κολώνες Κρατήσεων</h2>
				<p className="text-xs text-muted-foreground mt-0.5">
					Σύρετε για αλλαγή σειράς · Checkbox για ορατότητα
				</p>
			</div>
			<div style={{
				height: '60vh',
				overflow: 'auto'
			}}>
				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragEnd={handleDragEnd}
				>
					<SortableContext
						items={columns.map((c) => c.key)}
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-1.5">
							{columns.map((col) => (
								<SortableColumn
									key={col.key}
									col={col}
									onToggle={() => handleToggle(col.key)}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>
			</div>

			<div className="flex gap-2 pt-1">
				<Button size="sm" onClick={handleSave} disabled={!isDirty}>
					Αποθήκευση
				</Button>
				<Button size="sm" variant="outline" onClick={handleReset}>
					Επαναφορά
				</Button>
			</div>
		</div>
	);
}
