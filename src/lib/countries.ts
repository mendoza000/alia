export const COUNTRY_OPTIONS = [
    { value: "CO", label: "Colombia" },
    { value: "MX", label: "México" },
    { value: "US", label: "Estados Unidos" },
    { value: "PE", label: "Perú" },
    { value: "CL", label: "Chile" },
    { value: "AR", label: "Argentina" },
    { value: "VE", label: "Venezuela" },
    { value: "ES", label: "España" },
    { value: "OTHER", label: "Otro" },
];

export function getCountryLabel(code: string | null): string {
    if (!code) return "No especificado";
    const known = COUNTRY_OPTIONS.find(o => o.value === code);
    if (known) return known.label;
    try {
        return new Intl.DisplayNames(["es"], { type: "region" }).of(code) ?? code;
    } catch {
        return code;
    }
}
