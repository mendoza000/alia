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
                <div className="grid gap-3 sm:hidden">
                    {items.map((item, i) => (
                        <div key={getKey ? getKey(item, i) : i}>
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
