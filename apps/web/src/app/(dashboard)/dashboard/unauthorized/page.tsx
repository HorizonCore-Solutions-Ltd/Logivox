import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex h-[80vh] flex-col items-center justify-center space-y-6">
      <div className="rounded-full bg-destructive/10 p-6">
        <AlertCircle className="h-16 w-16 text-destructive" />
      </div>
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tighter">Access Denied</h1>
        <p className="text-muted-foreground text-lg">
          You do not have the necessary permissions to view this secure area.
        </p>
      </div>
      <Button asChild variant="default">
        <Link href="/dashboard/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
