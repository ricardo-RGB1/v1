import Link from "next/link";
import { CrownIcon } from "lucide-react";
import { formatDuration, intervalToDuration } from "date-fns";

import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";

interface Props {
  credits: number;
  msBeforeNext: number;
}

export const Usage = ({ credits, msBeforeNext }: Props) => {
  const { has } = useAuth();
  const hasProAccess = has?.({ plan: "pro" });
  return (
    <div className="rounded-t-xl bg-background border border-b-0 p-2.5">
      <div className="flex items-center gap-x-2">
        <div>
          <p className="text-sm">
            {credits} {hasProAccess ? "" : "free"} credits remaining
          </p>
          <p className="text-xs text-muted-foreground">
            Resets in{" "}
            <span className="font-medium">
              {formatDuration(
                intervalToDuration({
                  start: new Date(),
                  end: new Date(Date.now() + msBeforeNext),
                }),
                {
                  format: ["months", "days", "hours"],
                }
              )}
            </span>
          </p>
        </div>
        {/* Show upgrade button if user does not have pro access */}
        {!hasProAccess && ( 
          <Button asChild size="sm" variant="tertiary" className="ml-auto">
          <Link href="/pricing">
            <CrownIcon className="size-4" />
            <span>Upgrade</span>
          </Link>
        </Button>
        )}
      </div>
    </div>
  );
};
