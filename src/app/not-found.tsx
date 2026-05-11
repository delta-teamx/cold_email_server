import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h2 className="text-lg font-semibold">Page not found.</h2>
      <Button asChild variant="secondary">
        <Link href="/domains">Back to dashboard</Link>
      </Button>
    </div>
  );
}
