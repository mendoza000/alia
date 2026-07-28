export function LegalPageLayout({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="mx-auto max-w-3xl px-6 py-16 md:px-12 lg:py-24">
            <h1 className="font-heading text-3xl font-bold sm:text-4xl">
                {title}
            </h1>
            <div className="mt-8 space-y-6 text-sm leading-relaxed sm:text-base [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_p]:text-muted-foreground">
                {children}
            </div>
        </div>
    );
}
