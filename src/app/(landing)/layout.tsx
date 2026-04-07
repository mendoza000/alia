import { Footer } from "@/components/landing/footer";
import { Header } from "@/components/landing/header";
import { Toaster } from "@/components/ui/sonner";

export default function LandingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-svh flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster position="top-right" richColors />
        </div>
    );
}
