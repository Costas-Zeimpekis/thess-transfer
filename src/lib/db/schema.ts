import { relations } from "drizzle-orm";
import {
	boolean,
	date,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	serial,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const bookingStatusEnum = pgEnum("booking_status", [
	"pending",
	"confirmed",
	"completed",
	"cancelled",
]);

export const bookingSourceEnum = pgEnum("booking_source", [
	"automatic",
	"manual",
]);

export const vehicleTypeEnum = pgEnum("vehicle_type", ["car", "van", "bus"]);

export const paymentMethodEnum = pgEnum("payment_method", [
	"cash",
	"paypal",
	"credit_card",
	"bank",
	"paid",
]);

export const providerEmailOperationEnum = pgEnum("provider_email_operation", [
	"all",
	"booking",
	"modification",
	"cancellation",
]);

export const customFieldTypeEnum = pgEnum("custom_field_type", [
	"text",
	"number",
	"boolean",
	"date",
	"select",
]);

export const customFieldEntityEnum = pgEnum("custom_field_entity", [
	"booking",
	"driver",
	"vehicle",
	"partner",
	"micro_expense",
]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
	id: serial("id").primaryKey(),
	username: varchar("username", { length: 100 }).unique().notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
	id: uuid("id").primaryKey().defaultRandom(),
	userId: integer("user_id")
		.notNull()
		.references(() => users.id, { onDelete: "cascade" }),
	expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Providers ────────────────────────────────────────────────────────────────

export const providers = pgTable("providers", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 200 }).notNull(),
	slug: varchar("slug", { length: 100 }).unique().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const providerEmails = pgTable("provider_emails", {
	id: serial("id").primaryKey(),
	providerId: integer("provider_id")
		.notNull()
		.references(() => providers.id, { onDelete: "cascade" }),
	email: varchar("email", { length: 200 }).unique().notNull(),
	operation: providerEmailOperationEnum("operation").notNull().default("all"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Drivers ──────────────────────────────────────────────────────────────────

export const drivers = pgTable("drivers", {
	id: serial("id").primaryKey(),
	fullName: varchar("full_name", { length: 200 }).notNull(),
	idCard: varchar("id_card", { length: 50 }),
	phone: varchar("phone", { length: 50 }),
	email: varchar("email", { length: 200 }),
	googleCalendarId: varchar("google_calendar_id", { length: 200 }),
	active: boolean("active").default(true),
	customFields: jsonb("custom_fields").default({}),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export const vehicles = pgTable("vehicles", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 200 }).notNull(),
	plate: varchar("plate", { length: 50 }).unique().notNull(),
	type: vehicleTypeEnum("type").notNull(),
	brand: varchar("brand", { length: 100 }),
	active: boolean("active").default(true),
	customFields: jsonb("custom_fields").default({}),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Partners ─────────────────────────────────────────────────────────────────

export const partners = pgTable("partners", {
	id: serial("id").primaryKey(),
	name: varchar("name", { length: 200 }).notNull(),
	email: varchar("email", { length: 200 }),
	phone: varchar("phone", { length: 50 }),
	contactInfo: text("contact_info"),
	customFields: jsonb("custom_fields").default({}),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Bookings ─────────────────────────────────────────────────────────────────

export const bookings = pgTable(
	"bookings",
	{
		id: serial("id").primaryKey(),
		providerBookingRef: varchar("provider_booking_ref", { length: 200 }),
		providerId: integer("provider_id").references(() => providers.id),
		source: bookingSourceEnum("source").notNull().default("automatic"),
		status: bookingStatusEnum("status").notNull().default("pending"),

		// Trip
		pickupDatetime: timestamp("pickup_datetime", {
			withTimezone: true,
		}).notNull(),
		flightNumber: varchar("flight_number", { length: 50 }),
		pickupLocation: text("pickup_location").notNull(),
		dropoffLocation: text("dropoff_location").notNull(),
		passengerCount: integer("passenger_count").notNull().default(1),
		vehicleType: vehicleTypeEnum("vehicle_type").notNull(),
		babySeat: integer("baby_seat").default(0),
		boosterSeat: integer("booster_seat").default(0),

		// Customer
		customerName: varchar("customer_name", { length: 200 }).notNull(),
		customerPhone: varchar("customer_phone", { length: 50 }),
		customerEmail: varchar("customer_email", { length: 200 }),

		// Financials
		paymentMethod: paymentMethodEnum("payment_method"),
		notes: text("notes"),
		realPrice: numeric("real_price", { precision: 10, scale: 2 }),
		declaredPrice: numeric("declared_price", { precision: 10, scale: 2 }),

		// Assignment
		driverId: integer("driver_id").references(() => drivers.id, {
			onDelete: "set null",
		}),
		vehicleId: integer("vehicle_id").references(() => vehicles.id, {
			onDelete: "set null",
		}),
		partnerId: integer("partner_id").references(() => partners.id, {
			onDelete: "set null",
		}),
		partnerAssignmentPrice: numeric("partner_assignment_price", {
			precision: 10,
			scale: 2,
		}),

		// Return trip
		linkedBookingId: integer("linked_booking_id"),
		isReturnTrip: boolean("is_return_trip").default(false),

		// Google Calendar (Phase B)
		googleCalendarEventId: varchar("google_calendar_event_id", { length: 200 }),

		customFields: jsonb("custom_fields").default({}),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
	},
	(t) => [unique().on(t.providerBookingRef, t.providerId)],
);

// ─── Booking History ──────────────────────────────────────────────────────────

export const bookingHistory = pgTable("booking_history", {
	id: serial("id").primaryKey(),
	bookingId: integer("booking_id")
		.notNull()
		.references(() => bookings.id, { onDelete: "cascade" }),
	action: varchar("action", { length: 100 }).notNull(),
	source: bookingSourceEnum("source").notNull(),
	changedBy: integer("changed_by").references(() => users.id, {
		onDelete: "set null",
	}),
	changes: jsonb("changes"),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Micro Expenses ───────────────────────────────────────────────────────────

export const microExpenses = pgTable("micro_expenses", {
	id: serial("id").primaryKey(),
	driverId: integer("driver_id")
		.references(() => drivers.id, { onDelete: "set null" }),
	bookingId: integer("booking_id").references(() => bookings.id, {
		onDelete: "set null",
	}),
	reason: varchar("reason", { length: 200 }).notNull(),
	price: numeric("price", { precision: 10, scale: 2 }).notNull(),
	date: date("date").notNull(),
	description: text("description"),
	customFields: jsonb("custom_fields").default({}),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Custom Field Definitions ─────────────────────────────────────────────────

export const customFieldDefinitions = pgTable("custom_field_definitions", {
	id: serial("id").primaryKey(),
	entityType: customFieldEntityEnum("entity_type").notNull(),
	name: varchar("name", { length: 100 }).notNull(),
	label: varchar("label", { length: 200 }).notNull(),
	fieldType: customFieldTypeEnum("field_type").notNull().default("text"),
	options: jsonb("options"),
	required: boolean("required").default(false),
	active: boolean("active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const providersRelations = relations(providers, ({ many }) => ({
	emails: many(providerEmails),
	bookings: many(bookings),
}));

export const providerEmailsRelations = relations(providerEmails, ({ one }) => ({
	provider: one(providers, {
		fields: [providerEmails.providerId],
		references: [providers.id],
	}),
}));

export const driversRelations = relations(drivers, ({ many }) => ({
	bookings: many(bookings),
	microExpenses: many(microExpenses),
}));

export const vehiclesRelations = relations(vehicles, ({ many }) => ({
	bookings: many(bookings),
}));

export const partnersRelations = relations(partners, ({ many }) => ({
	bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
	provider: one(providers, {
		fields: [bookings.providerId],
		references: [providers.id],
	}),
	driver: one(drivers, {
		fields: [bookings.driverId],
		references: [drivers.id],
	}),
	vehicle: one(vehicles, {
		fields: [bookings.vehicleId],
		references: [vehicles.id],
	}),
	partner: one(partners, {
		fields: [bookings.partnerId],
		references: [partners.id],
	}),
	history: many(bookingHistory),
}));

export const bookingHistoryRelations = relations(bookingHistory, ({ one }) => ({
	booking: one(bookings, {
		fields: [bookingHistory.bookingId],
		references: [bookings.id],
	}),
	user: one(users, {
		fields: [bookingHistory.changedBy],
		references: [users.id],
	}),
}));

export const microExpensesRelations = relations(microExpenses, ({ one }) => ({
	driver: one(drivers, {
		fields: [microExpenses.driverId],
		references: [drivers.id],
	}),
}));

export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));
