import { cn } from "@/lib/utils";

/**
 * Wraps a desktop `<Table>` with its own horizontal scroll container (so a
 * wide table scrolls itself instead of the whole page — see
 * admin-shell.tsx's `<main>`, which deliberately no longer scrolls) and, when
 * `mobileRender` is given, renders a card per row below `sm` instead of
 * forcing the table to squeeze into a phone width.
 */
export function DataTableShell<T>({
    items,
    getKey,
    mobileRender,
    children,
}: {
    items: T[];
    getKey?: (item: T, index: number) => string;
    mobileRender?: (item: T, index: number) => React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <>
            {mobileRender && (
                // grid-cols-1 (not just `grid`) matters here: Tailwind's
                // grid-cols-N sets `minmax(0, 1fr)` on the track, which lets
                // it shrink to the container width. A bare `grid` leaves the
                // implicit column sized by `auto` — content-based — so a
                // single unusually wide card anywhere in the list (e.g. an
                // unbroken long string) stretches every card's track to
                // match it, and since <main> no longer scrolls (Fase 2.1),
                // that overflow was invisible instead of showing a scrollbar.
                <div className="grid grid-cols-1 gap-3 sm:hidden">
                    {items.map((item, i) => (
                        <div
                            key={getKey ? getKey(item, i) : i}
                            className="min-w-0"
                        >
                            {mobileRender(item, i)}
                        </div>
                    ))}
                </div>
            )}
            <div
                className={cn(
                    "overflow-x-auto rounded-lg border border-border bg-card",
                    mobileRender && "hidden sm:block",
                )}
            >
                {children}
            </div>
        </>
    );
}
