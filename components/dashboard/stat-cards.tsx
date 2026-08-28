import {
  Briefcase,
  Clock3,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { STATS } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const ICONS = {
  users: Users,
  wallet: Wallet,
  clock: Clock3,
  briefcase: Briefcase,
} as const;

export function StatCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {STATS.map((s) => {
        const Icon = ICONS[s.icon];
        const TrendIcon =
          s.trend.direction === "up" ? TrendingUp : TrendingDown;
        return (
          <Card
            key={s.id}
            className="rounded-[20px] border-0 shadow-[0_1px_2px_rgba(43,43,70,0.06),0_8px_24px_rgba(43,43,70,0.06)]"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    s.accent,
                  )}
                >
                  <Icon className="size-5 text-[#2b2b46]" />
                </div>
                <Badge
                  variant="secondary"
                  className={cn(
                    "gap-1 rounded-full border-0 px-2 py-1 text-xs font-semibold",
                    s.trend.positive
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700",
                  )}
                >
                  <TrendIcon className="size-3" />
                  {s.trend.value}
                </Badge>
              </div>
              <p className="mt-4 text-xs font-semibold tracking-widest text-muted-foreground">
                {s.label.toUpperCase()}
              </p>
              <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight text-[#2b2b46]">
                {s.value}
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground">{s.sub}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
