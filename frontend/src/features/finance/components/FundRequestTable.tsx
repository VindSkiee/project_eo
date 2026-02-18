import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import type { FundRequest } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface FundRequestTableProps {
  fundRequests: FundRequest[];
  onApprove: (fundRequest: FundRequest) => void;
  onReject: (fundRequest: FundRequest) => void;
}

export function FundRequestTable({
  fundRequests,
  onApprove,
  onReject,
}: FundRequestTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Dari</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Kegiatan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fundRequests.map((fr, idx) => (
            <TableRow key={fr.id}>
              <TableCell className="font-medium text-slate-500">
                {idx + 1}
              </TableCell>
              <TableCell>
                <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">
                  {fr.description}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(fr.createdAt)}
                </p>
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {fr.communityGroup?.name || fr.requestedBy?.fullName || "—"}
              </TableCell>
              <TableCell className="font-medium text-slate-900">
                {formatRupiah(fr.amount)}
              </TableCell>
              <TableCell className="text-sm text-slate-500">
                {fr.event?.title || "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    fr.status === "APPROVED"
                      ? "default"
                      : fr.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-[10px]"
                >
                  {fr.status === "PENDING"
                    ? "Menunggu"
                    : fr.status === "APPROVED"
                    ? "Disetujui"
                    : "Ditolak"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {fr.status === "PENDING" && (
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      title="Setujui"
                      onClick={() => onApprove(fr)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Tolak"
                      onClick={() => onReject(fr)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
