"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
	count: {
		label: "Citas",
		color: "var(--chart-1)",
	},
} satisfies ChartConfig;

interface AppointmentsChartProps {
	data: Array<{ date: string; count: number }>;
}

export function AppointmentsChart({ data }: AppointmentsChartProps) {
	const hasData = data.some((d) => d.count > 0);
	const total = data.reduce((sum, d) => sum + d.count, 0);

	return (
		<Card className="border-0 shadow-none">
			<CardHeader>
				<CardDescription className="flex items-center gap-2">
					<span>Últimos 30 días</span>
					<span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-foreground">
						30 días
					</span>
				</CardDescription>
				<CardTitle className="font-heading text-2xl">
					{total.toLocaleString("es-CO")} citas
				</CardTitle>
			</CardHeader>
			<CardContent>
				{hasData ? (
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-72 w-full"
					>
						<AreaChart data={data}>
							<defs>
								<linearGradient
									id="fillCount"
									x1="0"
									y1="0"
									x2="0"
									y2="1"
								>
									<stop
										offset="5%"
										stopColor="var(--color-count)"
										stopOpacity={0.3}
									/>
									<stop
										offset="95%"
										stopColor="var(--color-count)"
										stopOpacity={0.05}
									/>
								</linearGradient>
							</defs>
							<CartesianGrid
								vertical={false}
								strokeDasharray="3 3"
							/>
							<XAxis
								dataKey="date"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={(v: string) => {
									const d = new Date(`${v}T12:00:00`);
									return d.toLocaleDateString("es-CO", {
										day: "numeric",
										month: "short",
									});
								}}
								interval="preserveStartEnd"
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								allowDecimals={false}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										labelFormatter={(v: string) => {
											const d = new Date(
												`${v}T12:00:00`,
											);
											return d.toLocaleDateString(
												"es-CO",
												{
													day: "numeric",
													month: "long",
													year: "numeric",
												},
											);
										}}
									/>
								}
							/>
							<Area
								type="monotone"
								dataKey="count"
								stroke="var(--color-count)"
								strokeWidth={2}
								fill="url(#fillCount)"
							/>
						</AreaChart>
					</ChartContainer>
				) : (
					<div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
						No hay datos suficientes
					</div>
				)}
			</CardContent>
		</Card>
	);
}
