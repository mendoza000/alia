import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
	Calendar,
	DollarSign,
	Stethoscope,
	TrendingUp,
	UsersRound,
} from "lucide-react";
import { headers } from "next/headers";
import { AnimatedCard } from "@/components/admin/animated-card";
import { AppointmentsChart } from "@/components/admin/appointments-chart";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { StatCard } from "@/components/admin/stat-card";
import { UpcomingAppointments } from "@/components/admin/upcoming-appointments";
import { auth } from "@/lib/auth";
import {
	formatCOP,
	getAppointmentsTrend,
	getDashboardStats,
	getRevenueTrend,
	getUpcomingAppointments,
} from "@/lib/admin/dashboard-queries";

function computeTrend(current: number, previous: number) {
	if (previous === 0) return current > 0 ? 100 : 0;
	return Math.round(((current - previous) / previous) * 100);
}

export default async function AdminDashboardPage() {
	const [session, stats, appointmentsTrend, revenueTrend, upcoming] =
		await Promise.all([
			auth.api.getSession({ headers: await headers() }),
			getDashboardStats(),
			getAppointmentsTrend(),
			getRevenueTrend(),
			getUpcomingAppointments(),
		]);

	const userName = session?.user?.name?.split(" ")[0] ?? "Admin";
	const todayFormatted = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", {
		locale: es,
	});

	const statCards = [
		{
			title: "Citas hoy",
			value: stats.appointmentsToday,
			icon: Calendar,
			bgColor: "bg-accent/20",
			borderColor: "border-accent/30",
			trend: {
				value: computeTrend(
					stats.appointmentsToday,
					stats.appointmentsYesterday,
				),
				label: "vs. ayer",
			},
		},
		{
			title: "Pacientes totales",
			value: stats.totalPatients.toLocaleString("es-CO"),
			icon: UsersRound,
			bgColor: "bg-secondary",
			borderColor: "border-secondary-foreground/10",
			trend: stats.newPatientsThisMonth > 0
				? {
						value: stats.newPatientsThisMonth,
						label: "nuevos este mes",
					}
				: undefined,
			description: "Registrados en la plataforma",
		},
		{
			title: "Ingresos del mes",
			value: formatCOP.format(stats.revenueThisMonth),
			icon: DollarSign,
			bgColor: "bg-ring/25",
			borderColor: "border-ring/40",
			trend: {
				value: computeTrend(
					stats.revenueThisMonth,
					stats.revenuePreviousMonth,
				),
				label: "vs. mes anterior",
			},
		},
		{
			title: "Psicólogos activos",
			value: stats.activePsychologists,
			icon: Stethoscope,
			bgColor: "bg-primary",
			borderColor: "border-primary-foreground/15",
			variant: "dark" as const,
		},
		...(stats.topPsychologist
			? [
					{
						title: "Más agendado este mes",
						value: stats.topPsychologist.name.split(" ").slice(0, 2).join(" "),
						icon: TrendingUp,
						bgColor: "bg-accent/20",
						borderColor: "border-accent/30",
						description: `${stats.topPsychologist.appointmentCount} citas este mes`,
					},
				]
			: []),
	];

	return (
		<div className="space-y-6">
			{/* Greeting */}
			<div>
				<p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
					{todayFormatted}
				</p>
				<h1 className="mt-1 font-heading text-2xl md:text-3xl font-bold">
					¡Hola, {userName}!
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					{stats.appointmentsToday > 0 ? (
						<>
							Tienes{" "}
							<span className="font-medium text-foreground">
								{stats.appointmentsToday}{" "}
								{stats.appointmentsToday === 1
									? "cita"
									: "citas"}
							</span>{" "}
							programadas para hoy
						</>
					) : (
						"No tienes citas programadas para hoy"
					)}
				</p>
			</div>

			{/* Stat Cards */}
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
				{statCards.map((card, i) => (
					<AnimatedCard key={card.title} delay={0.1 + i * 0.08}>
						<StatCard
							title={card.title}
							value={card.value}
							icon={card.icon}
							bgColor={card.bgColor}
							borderColor={card.borderColor}
							variant={card.variant}
							trend={card.trend}
							description={card.description}
						/>
					</AnimatedCard>
				))}
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<AnimatedCard delay={0.4}>
					<AppointmentsChart data={appointmentsTrend} />
				</AnimatedCard>
				<AnimatedCard delay={0.5}>
					<RevenueChart data={revenueTrend} />
				</AnimatedCard>
			</div>

			{/* Upcoming Appointments */}
			<AnimatedCard delay={0.6}>
				<UpcomingAppointments appointments={upcoming} />
			</AnimatedCard>
		</div>
	);
}
