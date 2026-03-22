import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowRight, CalendarClock } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

interface UpcomingAppointment {
	id: string;
	dateTime: Date;
	user: { name: string; email: string };
	psychologist: { name: string; photoUrl: string | null };
}

function getInitials(name: string) {
	return name
		.split(" ")
		.map((w) => w[0])
		.slice(0, 2)
		.join("")
		.toUpperCase();
}

export function UpcomingAppointments({
	appointments,
}: { appointments: UpcomingAppointment[] }) {
	return (
		<Card className="border-0 shadow-none">
			<CardHeader className="flex items-center justify-between">
				<div>
					<CardTitle className="text-base font-medium">
						Próximas citas
					</CardTitle>
					{appointments.length > 0 && (
						<CardDescription>
							{appointments.length}{" "}
							{appointments.length === 1
								? "cita pendiente"
								: "citas pendientes"}
						</CardDescription>
					)}
				</div>
				<Link
					href="/admin/citas"
					className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 px-3 py-1 text-xs font-medium transition-colors hover:bg-secondary"
				>
					Ver todas
					<ArrowRight className="size-3" />
				</Link>
			</CardHeader>
			<CardContent>
				{appointments.length > 0 ? (
					<div className="relative">
						{/* Timeline line */}
						<div className="absolute left-[1.625rem] top-3 bottom-3 w-px bg-gradient-to-b from-accent/40 via-border to-transparent" />

						<div className="space-y-1">
							{appointments.map((apt, index) => (
								<div
									key={apt.id}
									className="group/row relative flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-muted/30"
								>
									{/* Timeline dot */}
									<div className="relative z-10 flex shrink-0 items-center justify-center">
										<div
											className={`size-3 rounded-full ring-2 ring-card ${
												index === 0
													? "bg-accent"
													: "bg-border"
											}`}
										/>
									</div>

									<Avatar size="sm">
										<AvatarFallback>
											{getInitials(apt.user.name)}
										</AvatarFallback>
									</Avatar>

									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{apt.user.name}
										</p>
										<p className="truncate text-xs text-muted-foreground">
											con {apt.psychologist.name}
										</p>
									</div>

									<div className="text-right">
										<p className="text-sm font-medium">
											{format(
												apt.dateTime,
												"HH:mm",
											)}
										</p>
										<p className="text-xs text-muted-foreground">
											{format(
												apt.dateTime,
												"d MMM",
												{ locale: es },
											)}
										</p>
									</div>

									<span className="rounded-full border-0 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
										Confirmada
									</span>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
						<CalendarClock className="mb-2 size-8 opacity-50" />
						<p className="text-sm">
							No hay citas próximas programadas
						</p>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
