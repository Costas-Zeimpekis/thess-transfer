import { asc, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import BookingForm from "@/components/bookings/booking-form";
import { db } from "@/lib/db";
import {
	bookingHistory,
	bookings,
	drivers,
	partners,
	providers,
	vehicles,
} from "@/lib/db/schema";

type PageProps = { params: Promise<{ id: string }> };

export default async function BookingDetailPage({ params }: PageProps) {
	const { id } = await params;
	const bookingId = parseInt(id, 10);

	if (Number.isNaN(bookingId)) notFound();

	const rows = await db
		.select({
			id: bookings.id,
			providerBookingRef: bookings.providerBookingRef,
			providerId: bookings.providerId,
			source: bookings.source,
			status: bookings.status,
			pickupDatetime: bookings.pickupDatetime,
			flightNumber: bookings.flightNumber,
			pickupLocation: bookings.pickupLocation,
			dropoffLocation: bookings.dropoffLocation,
			passengerCount: bookings.passengerCount,
			vehicleType: bookings.vehicleType,
			babySeat: bookings.babySeat,
			boosterSeat: bookings.boosterSeat,
			customerName: bookings.customerName,
			customerPhone: bookings.customerPhone,
			customerEmail: bookings.customerEmail,
			paymentMethod: bookings.paymentMethod,
			notes: bookings.notes,
			realPrice: bookings.realPrice,
			declaredPrice: bookings.declaredPrice,
			driverId: bookings.driverId,
			vehicleId: bookings.vehicleId,
			partnerId: bookings.partnerId,
			partnerAssignmentPrice: bookings.partnerAssignmentPrice,
			createdAt: bookings.createdAt,
		})
		.from(bookings)
		.leftJoin(providers, eq(bookings.providerId, providers.id))
		.where(eq(bookings.id, bookingId))
		.limit(1);

	if (rows.length === 0) notFound();

	const booking = rows[0];

	const [
		history,
		allProviders,
		allDrivers,
		allVehicles,
		allPartners,
	] = await Promise.all([
		db
			.select()
			.from(bookingHistory)
			.where(eq(bookingHistory.bookingId, bookingId))
			.orderBy(desc(bookingHistory.createdAt)),
		db
			.select({ id: providers.id, name: providers.name })
			.from(providers)
			.orderBy(asc(providers.name)),
		db
			.select({ id: drivers.id, fullName: drivers.fullName })
			.from(drivers)
			.where(eq(drivers.active, true))
			.orderBy(asc(drivers.fullName)),
		db
			.select({ id: vehicles.id, name: vehicles.name, plate: vehicles.plate })
			.from(vehicles)
			.where(eq(vehicles.active, true))
			.orderBy(asc(vehicles.name)),
		db
			.select({ id: partners.id, name: partners.name })
			.from(partners)
			.orderBy(asc(partners.name)),
	]);

	return (
		<div className="w-full">
			<BookingForm
				booking={{
					id: booking.id,
					providerBookingRef: booking.providerBookingRef,
					providerId: booking.providerId,
					status: booking.status,
					pickupDatetime: booking.pickupDatetime?.toISOString() ?? "",
					flightNumber: booking.flightNumber,
					pickupLocation: booking.pickupLocation,
					dropoffLocation: booking.dropoffLocation,
					passengerCount: booking.passengerCount,
					vehicleType: booking.vehicleType,
					babySeat: booking.babySeat,
					boosterSeat: booking.boosterSeat,
					customerName: booking.customerName,
					customerPhone: booking.customerPhone,
					customerEmail: booking.customerEmail,
					paymentMethod: booking.paymentMethod,
					notes: booking.notes,
					realPrice: booking.realPrice,
					declaredPrice: booking.declaredPrice,
					driverId: booking.driverId,
					vehicleId: booking.vehicleId,
					partnerId: booking.partnerId,
					partnerAssignmentPrice: booking.partnerAssignmentPrice,
					createdAt: booking.createdAt?.toISOString() ?? null,
				}}
				providers={allProviders}
				drivers={allDrivers}
				vehicles={allVehicles}
				partners={allPartners}
				history={history}
			/>
		</div>
	);
}
