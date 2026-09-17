"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export function ClientFilters({
    psychologists,
}: {
    /** Omitted for a psychologist actor — they only ever see their own
     * clients, same reasoning as appointments-filters.tsx. */
    psychologists?: { id: string; name: string }[];
}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") ?? "");

    const updateParam = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value && value !== "all") {
                params.set(key, value);
            } else {
                params.delete(key);
            }
            router.push(`?${params.toString()}`);
        },
        [router, searchParams],
    );

    return (
        <div className="flex flex-wrap gap-3">
            <div className="flex w-full gap-2 sm:w-64">
                <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por nombre o correo"
                    onKeyDown={e => {
                        if (e.key === "Enter") updateParam("search", search);
                    }}
                />
                <Button
                    variant="outline"
                    onClick={() => updateParam("search", search)}
                >
                    Buscar
                </Button>
            </div>

            {psychologists && (
                <Select
                    items={[
                        { value: "all", label: "Todos los psicólogos" },
                        ...psychologists.map(p => ({
                            value: p.id,
                            label: p.name,
                        })),
                    ]}
                    value={searchParams.get("psychologistId") ?? "all"}
                    onValueChange={v =>
                        updateParam("psychologistId", v ?? "all")
                    }
                >
                    <SelectTrigger className="h-9 w-full sm:w-52">
                        <SelectValue placeholder="Psicólogo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            Todos los psicólogos
                        </SelectItem>
                        {psychologists.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            <Input
                type="date"
                className="h-9 w-full sm:w-40"
                value={searchParams.get("joinedFrom") ?? ""}
                onChange={e => updateParam("joinedFrom", e.target.value)}
                title="Ingresó desde"
            />
            <Input
                type="date"
                className="h-9 w-full sm:w-40"
                value={searchParams.get("joinedTo") ?? ""}
                onChange={e => updateParam("joinedTo", e.target.value)}
                title="Ingresó hasta"
            />
        </div>
    );
}
