import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  CalendarDays,
  ArrowRight,
  Activity,
  User,
  Users,
  Clock,
} from "lucide-react";
import type { EventItem } from "@/shared/types";
import type { EventStatusType } from "@/features/event/types";

// ─── Konfigurasi Status ──────────────────────────────────────────────
const statusConfig: Record<EventStatusType, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
  SUBMITTED: { label: "Diajukan", className: "bg-amber-50 text-amber-700 border-amber-200" },
  UNDER_REVIEW: { label: "Dalam Review", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  APPROVED: { label: "Disetujui", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Ditolak", className: "bg-red-50 text-red-700 border-red-200" },
  CANCELLED: { label: "Dibatalkan", className: "bg-rose-50 text-rose-700 border-rose-200" },
  FUNDED: { label: "Didanai", className: "bg-blue-50 text-blue-700 border-blue-200" },
  ONGOING: { label: "Berlangsung", className: "bg-purple-50 text-purple-700 border-purple-200" },
  COMPLETED: { label: "Selesai", className: "bg-teal-50 text-teal-700 border-teal-200" },
  SETTLED: { label: "Diselesaikan", className: "bg-green-50 text-green-700 border-green-200" },
};

function getStatusInfo(status: string) {
  return statusConfig[status as EventStatusType] ?? {
    label: status,
    className: "bg-slate-50 text-slate-600 border-slate-200",
  };
}

// ─── Props ───────────────────────────────────────────────────────────
interface RecentEventsCardProps {
  events: EventItem[];
  loading: boolean;
  viewAllLink?: string;
  eventDetailBasePath?: string;
  limit?: number;
}

// ─── Component ───────────────────────────────────────────────────────
export function RecentEventsCard({
  events,
  loading,
  viewAllLink = "/dashboard/kegiatan",
  eventDetailBasePath = "/dashboard/events",
  limit = 5,
}: RecentEventsCardProps) {
  const items = events.slice(0, limit);

  // ─── Loading Skeleton ─────────────────────────────────────────────
  if (loading) {
    return (
      <Card className="flex flex-col border-0 ring-1 ring-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-2xl overflow-hidden h-full">
        <CardHeader className="pb-4 pt-5 px-6 border-b border-slate-100">
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-3 w-40 bg-slate-100 rounded mt-1 animate-pulse" />
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="h-10 w-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4 bg-slate-200" />
                  <Skeleton className="h-3 w-1/2 bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── Empty State ──────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <Card className="flex flex-col border-0 ring-1 ring-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-2xl overflow-hidden h-full">
        <CardHeader className="pb-4 pt-5 px-6 border-b border-slate-100">
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Kegiatan Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 ring-4 ring-slate-100/50">
            <CalendarDays className="h-8 w-8 text-slate-300" />
          </div>
          <h4 className="text-sm font-medium text-slate-700">Belum ada kegiatan</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
            Kegiatan yang dibuat akan muncul di sini. Mulai dengan membuat kegiatan baru.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ─── Main Content ─────────────────────────────────────────────────
  return (
    <Card className="flex flex-col border-0 ring-1 ring-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-2xl overflow-hidden h-full bg-white">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 px-6 border-b border-slate-100">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Kegiatan Terbaru
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Menampilkan {limit} kegiatan terakhir
          </CardDescription>
        </div>
        <Link
          to={viewAllLink}
          className="group inline-flex items-center text-xs font-medium text-slate-500 hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-slate-50"
        >
          Lihat semua
          <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </CardHeader>

      {/* List */}
      <CardContent className="flex-1 p-0">
        <div className="divide-y divide-slate-100">
          {items.map((event) => {
            const info = getStatusInfo(event.status);
            const startDate = event.startDate ? new Date(event.startDate) : null;
            const formattedDate = startDate
              ? startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Tanggal belum ditentukan';

            return (
              <Link
                key={event.id}
                to={`${eventDetailBasePath}/${event.id}`}
                className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 transition-all duration-200 group"
              >
                {/* Tanggal Box */}
                <div className="flex flex-col items-center justify-center h-12 w-12 rounded-xl bg-slate-50 border border-slate-100 shrink-0 group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                  {startDate ? (
                    <>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase leading-none mt-1">
                        {startDate.toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                      <span className="text-base font-bold text-slate-800 leading-tight">
                        {startDate.getDate()}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-300 text-center">—</span>
                  )}
                </div>

                {/* Konten Utama */}
                <div className="flex-1 min-w-0">
                  {/* Baris judul dan badge */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <h4 className="text-sm font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0.5 font-medium shadow-none shrink-0 ${info.className}`}
                    >
                      {info.label}
                    </Badge>
                  </div>

                  {/* Metadata dengan ikon */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {event.communityGroup?.name && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate max-w-[100px]">{event.communityGroup.name}</span>
                      </span>
                    )}
                    {event.createdBy?.fullName && (
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate max-w-[100px]">{event.createdBy.fullName}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{formattedDate}</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Ekspor dengan nama backward-compatible
export { RecentEventsCard as RecentEvents };