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
            <div className="mt-8 space-y-6 text-sm leading-relaxed sm:text-base [&_a]:text-foreground [&_a]:underline [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-base [&_h3]:font-semibold [&_li]:text-muted-foreground [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5">
                {children}
            </div>
        </div>
    );
}
