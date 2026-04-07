import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const geistMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-geist-mono",
});

export const metadata: Metadata = {
	description: "Thess Transfers",
	title: "Thess Transfers",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="el">
			<body className={`${geistMono.variable} antialiased`}>
				{children}
			</body>
		</html>
	);
}
