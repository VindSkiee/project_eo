import { Skeleton } from "@/shared/ui/skeleton";
import {
  CalendarDays,
  CheckCircle2,
  XCircle,
  Ban,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import type { EventItem } from "@/shared/types";

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

type StatusKey =
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

const statusConfig: Record<
  StatusKey,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  PENDING_APPROVAL: { label: "Menunggu", variant: "secondary" },
  APPROVED: { label: "Disetujui", variant: "default" },
  IN_PROGRESS: { label: "Berjalan", variant: "default" },
  COMPLETED: { label: "Selesai", variant: "outline" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
  REJECTED: { label: "Ditolak", variant: "destructive" },
};

interface EventsTableProps {
  events: EventItem[];
  loading: boolean;
  searchQuery: string;
  onEventClick: (eventId: string) => void;
  onEdit: (event: EventItem) => void;
  onDelete: (event: EventItem) => void;
  onApprove: (event: EventItem) => void;
  onReject: (event: EventItem) => void;
  onCancel: (event: EventItem) => void;
}

export function EventsTable({
  events,
  loading,
  searchQuery,
  onEventClick,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onCancel,
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

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                No
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
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
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {events.map((event, idx) => {
              const sc = statusConfig[event.status as StatusKey] || {
                label: event.status,
                variant: "outline" as const,
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
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center">
                      <p className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                        {event.title}
                      </p>
                      <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5 text-center">
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
                    <span
                      className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        event.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700"
                          : event.status === "PENDING_APPROVAL"
                          ? "bg-amber-50 text-amber-700"
                          : event.status === "IN_PROGRESS"
                          ? "bg-blue-50 text-blue-700"
                          : event.status === "COMPLETED"
                          ? "bg-slate-50 text-slate-600"
                          : event.status === "CANCELLED"
                          ? "bg-rose-50 text-rose-700"
                          : event.status === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : "bg-slate-50 text-slate-600"
                      }`}
                    >
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div
                      className="flex items-center justify-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.status === "DRAFT" && (
                        <>
                          <button
                            onClick={() => onEdit(event)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-500 transition-all duration-200"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onDelete(event)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {event.status === "PENDING_APPROVAL" && (
                        <>
                          <button
                            onClick={() => onApprove(event)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-500 transition-all duration-200"
                            title="Setujui"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onReject(event)}
                            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                            title="Tolak"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      {(event.status === "APPROVED" || event.status === "IN_PROGRESS") && (
                        <button
                          onClick={() => onCancel(event)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                          title="Batalkan"
                        >
                          <Ban className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {!["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_PROGRESS"].includes(
                        event.status
                      ) && (
                        <button
                          onClick={() => onEventClick(event.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-500 transition-all duration-200"
                          title="Lihat Detail"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
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
  );
}
