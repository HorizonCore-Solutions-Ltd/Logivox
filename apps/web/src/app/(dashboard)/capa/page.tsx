"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /capa  →  redirects to the CAPA Monitoring dashboard.
 * Users who land here (e.g. from an old link) are forwarded automatically.
 */
export default function CAPARootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/capa/hub");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground text-sm">Redirecting to CAPA Hub…</p>
    </div>
  );
}
