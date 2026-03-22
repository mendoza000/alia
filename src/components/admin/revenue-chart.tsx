"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
	revenue: {
		label: "Ingresos",
		color: "var(--chart-3)",
	},
} satisfies ChartConfig;

interface RevenueChartProps {
	data: Array<{ month: string; revenue: number }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
	const hasData = data.some((d) => d.revenue > 0);
	const total = data.reduce((sum, d) => sum + d.revenue, 0);

	const formatCOP = (value: number) =>
		new Intl.NumberFormat("es-CO", {
			style: "currency",
			currency: "COP",
			maximumFractionDigits: 0,
			notation: "compact",
		}).format(value);

	return (
		<Card className="border-0 shadow-none">
			<CardHeader>
				<CardDescription className="flex items-center gap-2">
					<span>Ingresos mensuales</span>
					<span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-foreground">
						6 meses
					</span>
				</CardDescription>
				<CardTitle className="font-heading text-2xl">
					{new Intl.NumberFormat("es-CO", {
						style: "currency",
						currency: "COP",
						maximumFractionDigits: 0,
					}).format(total)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{hasData ? (
					<ChartContainer
						config={chartConfig}
						className="aspect-auto h-72 w-full"
					>
						<BarChart data={data}>
							<CartesianGrid
								vertical={false}
								strokeDasharray="3 3"
							/>
							<XAxis
								dataKey="month"
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>
							<YAxis
								tickLine={false}
								axisLine={false}
								tickMargin={8}
								tickFormatter={formatCOP}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(value) =>
											new Intl.NumberFormat("es-CO", {
												style: "currency",
												currency: "COP",
												maximumFractionDigits: 0,
											}).format(value as number)
										}
									/>
								}
							/>
							<Bar
								dataKey="revenue"
								fill="var(--color-revenue)"
								radius={[8, 8, 0, 0]}
							/>
						</BarChart>
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
