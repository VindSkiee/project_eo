import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { Calendar, DollarSign, User } from "lucide-react";
import type { EventItem } from "@/shared/types";

function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Tidak ditentukan";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const eventStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Diajukan",
    UNDER_REVIEW: "Dalam Review",
    REJECTED: "Ditolak",
    APPROVED: "Disetujui",
    CANCELLED: "Dibatalkan",
    FUNDED: "Didanai",
    ONGOING: "Berlangsung",
    COMPLETED: "Selesai",
    SETTLED: "Diselesaikan",
  };
  return labels[status] || status;
};

const eventStatusClassName = (status: string): string => {
  const classes: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
    SUBMITTED: "bg-amber-50 text-amber-700 border-amber-200",
    UNDER_REVIEW: "bg-yellow-50 text-yellow-700 border-yellow-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
    FUNDED: "bg-blue-50 text-blue-700 border-blue-200",
    ONGOING: "bg-purple-50 text-purple-700 border-purple-200",
    COMPLETED: "bg-teal-50 text-teal-700 border-teal-200",
    SETTLED: "bg-green-50 text-green-700 border-green-200",
  };
  return classes[status] || "bg-slate-50 text-slate-600 border-slate-200";
};

interface EventHeaderProps {
  event: EventItem;
}

export function EventHeader({ event }: EventHeaderProps) {
  return (
    <Card>
      <CardContent className="py-6 sm:py-8">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-poppins">
                  {event.title}
                </h1>
                <Badge variant="outline" className={eventStatusClassName(event.status)}>
                  {eventStatusLabel(event.status)}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                <User className="inline h-4 w-4 mr-1" />
                Dibuat oleh:{" "}
                <span className="font-medium">
                  {event.createdBy?.fullName || "Tidak diketahui"}
                </span>
              </p>
            </div>
          </div>

          <Separator />

          {/* Event Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-50">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Estimasi Anggaran</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatRupiah(event.budgetEstimated)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Anggaran Aktual</p>
                <p className="text-sm font-bold text-slate-900">
                  {event.budgetActual ? formatRupiah(event.budgetActual) : "Belum diketahui"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-50">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Tanggal Mulai</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatDate(event.startDate)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orange-50">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Tanggal Selesai</p>
                <p className="text-sm font-bold text-slate-900">
                  {formatDate(event.endDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
