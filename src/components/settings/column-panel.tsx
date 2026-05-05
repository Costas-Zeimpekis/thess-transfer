"use client";

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
import { Checkbox } from "@/components/ui/checkbox";

export type Column = { key: string; label: string; visible: boolean };

function SortableColumn({ col, onToggle }: { col: Column; onToggle: () => void }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
		useSortable({ id: col.key });

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Transform.toString(transform), transition }}
			className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-md border select-none transition-shadow ${
				isDragging ? "shadow-lg opacity-90 z-50" : ""
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

type ColumnPanelProps = {
	title: string;
	description: string;
	columns: Column[];
	onChange: (cols: Column[]) => void;
};

export default function ColumnPanel({ title, description, columns, onChange }: ColumnPanelProps) {
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || active.id === over.id) return;
		const oldIndex = columns.findIndex((c) => c.key === active.id);
		const newIndex = columns.findIndex((c) => c.key === over.id);
		onChange(arrayMove(columns, oldIndex, newIndex));
	}

	function handleToggle(key: string) {
		onChange(columns.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
	}

	return (
		<div className="space-y-3">
			<div>
				<h2 className="font-semibold text-base">{title}</h2>
				<p className="text-xs text-muted-foreground mt-0.5">{description}</p>
			</div>
			<div style={{ maxHeight: "60vh", overflow: "auto" }}>
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
		</div>
	);
}
