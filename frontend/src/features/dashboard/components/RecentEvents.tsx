import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { CalendarDays, ArrowRight, FileText } from "lucide-react";
import type { EventItem } from "@/shared/types";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const STATUS_MAP: Record<string, { label: string; variant: BadgeVariant; dotColor: string }> = {
  DRAFT:            { label: "Draft",        variant: "secondary",   dotColor: "bg-slate-400" },
  SUBMITTED:        { label: "Diajukan",     variant: "secondary",   dotColor: "bg-amber-400" },
  APPROVED:         { label: "Disetujui",    variant: "default",     dotColor: "bg-emerald-400" },
  FUNDED:           { label: "Dana Cair",    variant: "default",     dotColor: "bg-blue-400" },
  ONGOING:          { label: "Berjalan",     variant: "default",     dotColor: "bg-sky-400" },
  COMPLETED:        { label: "Selesai",      variant: "secondary",   dotColor: "bg-green-400" },
  SETTLED:          { label: "Final",        variant: "secondary",   dotColor: "bg-emerald-500" },
  UNDER_REVIEW:     { label: "Review Dana",  variant: "outline",     dotColor: "bg-indigo-400" },
  REJECTED:         { label: "Ditolak",      variant: "destructive", dotColor: "bg-red-400" },
  CANCELLED:        { label: "Dibatalkan",   variant: "destructive", dotColor: "bg-rose-400" },
  PENDING_APPROVAL: { label: "Menunggu",     variant: "secondary",   dotColor: "bg-amber-400" },
};

function getStatusInfo(status: string) {
  return STATUS_MAP[status] ?? { label: status, variant: "secondary" as BadgeVariant, dotColor: "bg-slate-400" };
}

interface RecentEventsCardProps {
  events: EventItem[];
  loading: boolean;
  /** Link for "View all" button */
  viewAllLink?: string;
  /** Max items to show, default 5 */
  limit?: number;
}

export function RecentEventsCard({
  events,
  loading,
  viewAllLink = "/dashboard/kegiatan",
  limit = 5,
}: RecentEventsCardProps) {
  const items = events.slice(0, limit);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 font-poppins">
            Kegiatan Terbaru
          </CardTitle>
          <CardDescription className="text-xs">
            {limit} kegiatan terakhir
          </CardDescription>
        </div>
        <Link to={viewAllLink}>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary text-xs">
            Semua <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Belum ada kegiatan.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((event) => {
              const info = getStatusInfo(event.status);
              return (
                <Link
                  key={event.id}
                  to={`/dashboard/events/${event.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {event.startDate ? formatDate(event.startDate) : "—"}
                      {event.createdBy?.fullName && (
                        <span className="hidden sm:inline"> · {event.createdBy.fullName}</span>
                      )}
                    </p>
                  </div>
                  <Badge variant={info.variant} className="text-[10px] shrink-0 gap-1">
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${info.dotColor}`} />
                    {info.label}
                  </Badge>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Backward-compatible named export
export { RecentEventsCard as RecentEvents };
