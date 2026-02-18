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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return `${Math.floor(diffDays / 30)} bulan lalu`;
}

function getStatusBadge(status: string) {
  const variant =
    status === "APPROVED" || status === "IN_PROGRESS"
      ? "default"
      : status === "PENDING_APPROVAL"
      ? "secondary"
      : "destructive";

  const label =
    status === "PENDING_APPROVAL"
      ? "Menunggu"
      : status === "APPROVED"
      ? "Disetujui"
      : status === "IN_PROGRESS"
      ? "Berjalan"
      : status === "COMPLETED"
      ? "Selesai"
      : status === "CANCELLED"
      ? "Dibatalkan"
      : status;

  return { variant: variant as "default" | "secondary" | "destructive", label };
}

interface RecentEventsProps {
  events: EventItem[];
  loading: boolean;
}

export function RecentEvents({ events, loading }: RecentEventsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 font-poppins">
            Kegiatan Terbaru
          </CardTitle>
          <CardDescription className="text-xs">5 kegiatan terakhir</CardDescription>
        </div>
        <Link to="/dashboard/kegiatan">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary text-xs">
            Semua <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Belum ada kegiatan.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.slice(0, 5).map((event) => {
              const badge = getStatusBadge(event.status);
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {event.createdBy?.fullName || "—"} · {timeAgo(event.createdAt)}
                    </p>
                  </div>
                  <Badge variant={badge.variant} className="text-[10px] shrink-0">
                    {badge.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
