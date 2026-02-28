import { Skeleton } from "@/shared/ui/skeleton";
import { Badge } from "@/shared/ui/badge";
import { CalendarDays } from "lucide-react";
import { DataTable, type ColumnDef } from "@/shared/components/DataTable";
import { formatRupiah, formatDate } from "@/shared/helpers/formatters";
import { getEventStatusInfo } from "@/shared/helpers/statusConfig";
import type { EventItem } from "@/shared/types";

interface EventsTableProps {
  events: EventItem[];
  loading: boolean;
  searchQuery: string;
  onEventClick: (eventId: string) => void;
  currentUserId?: string;
}

export function EventsTable({
  events,
  loading,
  searchQuery,
  onEventClick,
  currentUserId,
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

  const columns: ColumnDef<EventItem>[] = [
    {
      key: "title",
      header: "Judul",
      render: (event) => (
        <div>
          <p className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
            {event.title}
          </p>
          <p className="text-xs text-slate-400 truncate max-w-[250px] mt-0.5">
            {event.description}
          </p>
        </div>
      ),
    },
    {
      key: "submitter",
      header: "Pengaju",
      // Tambahkan class agar isi sel menjadi rata tengah (sesuai gambar)
      cellClassName: "text-center",
      render: (event) => (
        // Gunakan flex-col dan items-center agar nama dan RT/RW rata tengah
        <div className="flex flex-col items-center justify-center gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-600">
              {event.createdBy?.fullName || "—"}
            </span>
            {currentUserId && event.createdById === currentUserId && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                Saya
              </Badge>
            )}
          </div>
          {event.communityGroup?.name && (
            <span className="text-xs text-slate-400">{event.communityGroup.name}</span>
          )}
        </div>
      ),
    },
    {
      key: "budget",
      header: "Anggaran",
      cellClassName: "text-center", // Tambahkan center jika ingin rata tengah seperti gambar
      render: (event) => (
        <span className="text-sm font-medium text-slate-700">
          {formatRupiah(event.budgetEstimated)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Tanggal",
      cellClassName: "text-center", // Tambahkan center jika ingin rata tengah seperti gambar
      render: (event) => (
        <span className="text-sm text-slate-500">
          {formatDate(event.startDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cellClassName: "text-center", // Memastikan status badge ada di tengah
      render: (event) => {
        const sc = getEventStatusInfo(event.status);
        return (
          <Badge variant="outline" className={`text-xs px-2.5 py-0.5 ${sc.className}`}>
            {sc.label}
          </Badge>
        );
      },
    },
  ];

  // Mobile card layout + Desktop table layout
  return (
    <>
      {/* Mobile Cards */}
      <div className="block md:hidden space-y-3">
        {events.map((event) => {
          const sc = getEventStatusInfo(event.status);
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
              <div className="flex items-center justify-between text-xs text-slate-500">
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">dibuat oleh {event.createdBy?.fullName || "—"}</span>
                    {currentUserId && event.createdById === currentUserId && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                        Saya
                      </Badge>
                    )}
                  </div>
                  {event.communityGroup?.name && (
                    <span className="text-slate-400">{event.communityGroup.name}</span>
                  )}
                </div>
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
        <DataTable
          columns={columns}
          data={events}
          keyExtractor={(e) => e.id}
          onRowClick={(e) => onEventClick(e.id)}
          showRowNumber
          rowNumberPadded
          footerText={`Menampilkan ${events.length} kegiatan`}
        />
      </div>
    </>
  );
}
