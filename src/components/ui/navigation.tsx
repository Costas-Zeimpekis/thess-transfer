"use client";

import {
	Bell,
	Building2,
	CalendarDays,
	Car,
	DatabaseBackup,
	Handshake,
	Receipt,
	Settings,
	User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
	{ label: "Κρατήσεις", href: "/bookings", icon: CalendarDays },
	{ label: "Οδηγοί", href: "/drivers", icon: User },
	{ label: "Οχήματα", href: "/vehicles", icon: Car },
	{ label: "Συνεργάτες", href: "/partners", icon: Handshake },
	{ label: "Πάροχοι", href: "/providers", icon: Building2 },
	{ label: "Μικροέξοδα", href: "/micro-expenses", icon: Receipt },
	{ label: "Ρυθμίσεις", href: "/settings", icon: Settings },
	{ label: "Ειδοποιήσεις", href: "/notifications", icon: Bell },
	{ label: "Αντίγραφα", href: "/backups", icon: DatabaseBackup },
];

export default function Navigation() {
	const pathname = usePathname();
	return (
		<nav className="flex  items-center gap-1 border-b bg-background">
			{navItems.map((item) => {
				const active = pathname.startsWith(item.href);
				return (
					<Link
						key={item.href}
						href={item.href}
						className={cn(
							"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors bg-[#333333] text-[#f9cf44] hover:bg-[#f9cf44] hover:text-[#333333]",
							active ? "bg-[#f9cf44] text-[#333333] font-medium" : "",
						)}
					>
						<item.icon className="h-4 w-4" />
						{item.label}
					</Link>
				);
			})}
		</nav>
	);
}
