import type { MetadataRoute } from "next";
import { getActivePsychologists } from "@/lib/queries/psychologists";
import { siteConfig } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const psychologists = await getActivePsychologists();

    return [
        {
            url: siteConfig.url,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 1,
        },
        {
            url: `${siteConfig.url}/psicologos`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.9,
        },
        ...psychologists.map(p => ({
            url: `${siteConfig.url}/psicologos/${p.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })),
    ];
}
