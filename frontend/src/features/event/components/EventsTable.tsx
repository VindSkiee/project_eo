import { Skeleton } from "@/shared/ui/skeleton";
import { Badge } from "@/shared/ui/badge";
import { CalendarDays } from "lucide-react";
import type { EventItem } from "@/shared/types";
import type { EventStatusType } from "@/features/event/types";

function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusConfig: Record<
  EventStatusType,
  { label: string; className: string }
> = {
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

interface EventsTableProps {
  events: EventItem[];
  loading: boolean;
  searchQuery: string;
  onEventClick: (eventId: string) => void;
}

export function EventsTable({
  events,
  loading,
  searchQuery,
  onEventClick,
}: EventsTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <CalendarDays className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">
          {searchQuery ? "Kegiatan tidak ditemukan" : "Belum ada kegiatan"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {searchQuery
            ? "Coba gunakan kata kunci lain"
            : "Buat kegiatan baru untuk memulai"}
        </p>
      </div>
    );
  }

  // Mobile card layout + Desktop table layout
  return (
    <>
      {/* Mobile Cards */}
      <div className="block md:hidden space-y-3">
        {events.map((event) => {
          const sc = statusConfig[event.status as EventStatusType] || {
            label: event.status,
            className: "bg-slate-50 text-slate-600 border-slate-200",
          };
          return (
            <div
              key={event.id}
              onClick={() => onEventClick(event.id)}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm active:bg-slate-50 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-medium text-slate-900 text-sm leading-tight flex-1">
                  {event.title}
                </h3>
                <Badge variant="outline" className={`shrink-0 text-[10px] px-2 py-0.5 ${sc.className}`}>
                  {sc.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 mb-3">
                {event.description}
              </p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{event.createdBy?.fullName || "—"}</span>
                <span className="font-medium text-slate-700">
                  {formatRupiah(event.budgetEstimated)}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {formatDate(event.startDate)}
                {event.endDate ? ` — ${formatDate(event.endDate)}` : ""}
              </div>
            </div>
          );
        })}
        <div className="text-xs text-slate-400 text-center py-2">
          Menampilkan {events.length} kegiatan
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                  No
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Judul
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Pengaju
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Anggaran
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {events.map((event, idx) => {
                const sc = statusConfig[event.status as EventStatusType] || {
                  label: event.status,
                  className: "bg-slate-50 text-slate-600 border-slate-200",
                };
                return (
                  <tr
                    key={event.id}
                    className="group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
                    onClick={() => onEventClick(event.id)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-slate-400 font-mono">
                        {(idx + 1).toString().padStart(2, "0")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                          {event.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate max-w-[250px] mt-0.5">
                          {event.description}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-slate-600">
                        {event.createdBy?.fullName || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-medium text-slate-700">
                        {formatRupiah(event.budgetEstimated)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm text-slate-500">
                        {formatDate(event.startDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant="outline" className={`text-xs ${sc.className}`}>
                        {sc.label}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 text-xs text-slate-400 text-center">
          Menampilkan {events.length} kegiatan
        </div>
      </div>
    </>
  );
}
