import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	description?: string;
	trend?: { value: number; label: string };
	bgColor?: string;
	borderColor?: string;
	variant?: "default" | "dark";
	className?: string;
}

export function StatCard({
	title,
	value,
	icon: Icon,
	description,
	trend,
	bgColor = "bg-secondary",
	borderColor,
	variant = "default",
	className,
}: StatCardProps) {
	const isDark = variant === "dark";

	return (
		<Card
			className={cn(
				"h-full min-h-[140px] ring-0 shadow-none",
				bgColor,
				borderColor ? `border ${borderColor}` : "border-0",
				isDark && "text-primary-foreground",
				className,
			)}
		>
			<CardContent className="flex h-full flex-col justify-between p-6">
				<div className="flex items-start justify-between">
					<p
						className={cn(
							"text-sm font-semibold",
							isDark
								? "text-primary-foreground/70"
								: "text-muted-foreground",
						)}
					>
						{title}
					</p>
					<div
						className={cn(
							"flex size-11 items-center justify-center rounded-xl",
							isDark ? "bg-white/15" : "bg-foreground/5",
						)}
					>
						<Icon
							className={cn(
								"size-5",
								isDark
									? "text-primary-foreground/80"
									: "text-foreground/70",
							)}
						/>
					</div>
				</div>
				<div>
					<p className="mt-3 font-heading text-3xl font-bold">
						{value}
					</p>
					<div className="mt-1 flex items-center gap-2">
						{trend && trend.value !== 0 ? (
							<span
								className={cn(
									"inline-flex items-center rounded-full px-1.5 py-0.5 text-xs",
									isDark
										? "bg-white/15 text-primary-foreground/80"
										: trend.value > 0
											? "bg-emerald-500/10 text-emerald-600"
											: "bg-destructive/10 text-destructive",
								)}
							>
								{trend.value > 0 ? "↑" : "↓"}{" "}
								{Math.abs(trend.value)}%
							</span>
						) : null}
						{trend ? (
							<span
								className={cn(
									"text-xs",
									isDark
										? "text-primary-foreground/60"
										: "text-muted-foreground",
								)}
							>
								{trend.label}
							</span>
						) : description ? (
							<span
								className={cn(
									"text-xs",
									isDark
										? "text-primary-foreground/60"
										: "text-muted-foreground",
								)}
							>
								{description}
							</span>
						) : null}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
