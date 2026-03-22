import { prisma } from "@/lib/db";

/** Colombia UTC-5 offset in ms */
const COLOMBIA_OFFSET_MS = 5 * 60 * 60 * 1000;

function colombiaToday() {
	const now = new Date(Date.now() - COLOMBIA_OFFSET_MS);
	const start = new Date(now);
	start.setUTCHours(0, 0, 0, 0);
	const end = new Date(now);
	end.setUTCHours(23, 59, 59, 999);
	// Convert back to UTC
	return {
		start: new Date(start.getTime() + COLOMBIA_OFFSET_MS),
		end: new Date(end.getTime() + COLOMBIA_OFFSET_MS),
	};
}

export async function getDashboardStats() {
	const { start, end } = colombiaToday();
	const monthStart = new Date(start);
	monthStart.setUTCDate(1);
	monthStart.setUTCHours(0, 0, 0, 0);

	// Yesterday range
	const yesterdayStart = new Date(start.getTime() - 24 * 60 * 60 * 1000);
	const yesterdayEnd = new Date(end.getTime() - 24 * 60 * 60 * 1000);

	// Previous month range
	const prevMonthEnd = new Date(monthStart.getTime() - 1);
	const prevMonthStart = new Date(prevMonthEnd);
	prevMonthStart.setUTCDate(1);
	prevMonthStart.setUTCHours(0, 0, 0, 0);

	const [
		appointmentsToday,
		appointmentsYesterday,
		totalPatients,
		newPatientsThisMonth,
		revenueResult,
		revenuePrevResult,
		activePsychologists,
	] = await Promise.all([
		prisma.appointment.count({
			where: {
				dateTime: { gte: start, lte: end },
				status: { in: ["CONFIRMED", "COMPLETED"] },
			},
		}),
		prisma.appointment.count({
			where: {
				dateTime: { gte: yesterdayStart, lte: yesterdayEnd },
				status: { in: ["CONFIRMED", "COMPLETED"] },
			},
		}),
		prisma.user.count({
			where: { role: "patient" },
		}),
		prisma.user.count({
			where: {
				role: "patient",
				createdAt: { gte: monthStart },
			},
		}),
		prisma.payment.aggregate({
			_sum: { finalAmount: true },
			where: {
				status: "APPROVED",
				paidAt: { gte: monthStart },
			},
		}),
		prisma.payment.aggregate({
			_sum: { finalAmount: true },
			where: {
				status: "APPROVED",
				paidAt: { gte: prevMonthStart, lte: prevMonthEnd },
			},
		}),
		prisma.psychologist.count({
			where: { isActive: true },
		}),
	]);

	return {
		appointmentsToday,
		appointmentsYesterday,
		totalPatients,
		newPatientsThisMonth,
		revenueThisMonth: revenueResult._sum.finalAmount ?? 0,
		revenuePreviousMonth: revenuePrevResult._sum.finalAmount ?? 0,
		activePsychologists,
	};
}

export async function getAppointmentsTrend() {
	const thirtyDaysAgo = new Date();
	thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

	const appointments = await prisma.appointment.findMany({
		where: {
			dateTime: { gte: thirtyDaysAgo },
			status: { in: ["CONFIRMED", "COMPLETED", "NO_SHOW"] },
		},
		select: { dateTime: true },
		orderBy: { dateTime: "asc" },
	});

	// Group by date (Colombia timezone)
	const grouped = new Map<string, number>();
	for (let i = 0; i < 30; i++) {
		const d = new Date();
		d.setDate(d.getDate() - 29 + i);
		const key = d.toISOString().slice(0, 10);
		grouped.set(key, 0);
	}

	for (const apt of appointments) {
		const colDate = new Date(apt.dateTime.getTime() - COLOMBIA_OFFSET_MS);
		const key = colDate.toISOString().slice(0, 10);
		if (grouped.has(key)) {
			grouped.set(key, (grouped.get(key) ?? 0) + 1);
		}
	}

	return Array.from(grouped.entries()).map(([date, count]) => ({
		date,
		count,
	}));
}

export async function getRevenueTrend() {
	const sixMonthsAgo = new Date();
	sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
	sixMonthsAgo.setDate(1);
	sixMonthsAgo.setHours(0, 0, 0, 0);

	const payments = await prisma.payment.findMany({
		where: {
			status: "APPROVED",
			paidAt: { gte: sixMonthsAgo },
		},
		select: { finalAmount: true, paidAt: true },
	});

	const grouped = new Map<string, number>();
	// Initialize last 6 months
	for (let i = 0; i < 6; i++) {
		const d = new Date();
		d.setMonth(d.getMonth() - 5 + i);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
		grouped.set(key, 0);
	}

	for (const p of payments) {
		if (!p.paidAt) continue;
		const key = `${p.paidAt.getFullYear()}-${String(p.paidAt.getMonth() + 1).padStart(2, "0")}`;
		if (grouped.has(key)) {
			grouped.set(key, (grouped.get(key) ?? 0) + p.finalAmount);
		}
	}

	const monthNames = [
		"Ene", "Feb", "Mar", "Abr", "May", "Jun",
		"Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
	];

	return Array.from(grouped.entries()).map(([key, revenue]) => {
		const month = Number.parseInt(key.split("-")[1], 10);
		return { month: monthNames[month - 1], revenue };
	});
}

export async function getUpcomingAppointments() {
	return prisma.appointment.findMany({
		where: {
			status: "CONFIRMED",
			dateTime: { gte: new Date() },
		},
		orderBy: { dateTime: "asc" },
		take: 5,
		select: {
			id: true,
			dateTime: true,
			user: { select: { name: true, email: true } },
			psychologist: { select: { name: true, photoUrl: true } },
		},
	});
}

export const formatCOP = new Intl.NumberFormat("es-CO", {
	style: "currency",
	currency: "COP",
	maximumFractionDigits: 0,
});
