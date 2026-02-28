import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Clock, AlertCircle } from "lucide-react";
import type { EventItem } from "@/shared/types";

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

const eventStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    DRAFT: "outline",
    SUBMITTED: "outline",
    UNDER_REVIEW: "outline",
    REJECTED: "destructive",
    APPROVED: "default",
    CANCELLED: "destructive",
    FUNDED: "default",
    ONGOING: "default",
    COMPLETED: "default",
    SETTLED: "default",
  };
  return variants[status] || "outline";
};

const eventStatusClassName = (status: string): string => {
  const classes: Record<string, string> = {
    SUBMITTED: "bg-yellow-50 text-yellow-700 border-yellow-200",
    UNDER_REVIEW: "bg-yellow-50 text-yellow-700 border-yellow-200",
  };
  return classes[status] || "";
};

interface StatusHistoryProps {
  event: EventItem;
}

export function StatusHistory({ event }: StatusHistoryProps) {
  if (!event.statusHistory || event.statusHistory.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Riwayat Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {event.statusHistory.map((history) => (
            <div key={history.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
              <div className="p-2 rounded-full bg-white">
                <AlertCircle className="h-4 w-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={eventStatusVariant(history.status)} className={eventStatusClassName(history.status)}>
                    {eventStatusLabel(history.status)}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    {formatDateTime(history.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-slate-700">
                  Diperbarui oleh:{" "}
                  <span className="font-medium">{history.changedBy.fullName}</span>
                </p>
                {history.reason && (
                  <p className="text-xs text-slate-600 mt-1 italic">"{history.reason}"</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
