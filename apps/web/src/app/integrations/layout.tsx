import { ReactNode } from "react";
import { Navigation } from "@/components/landing";
import { Footer } from "@/components/layout/footer";

export default function IntegrationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Navigation />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
