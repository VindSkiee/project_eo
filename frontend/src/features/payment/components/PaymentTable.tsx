import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Receipt,
  AlertCircle,
} from "lucide-react";
import type { PaymentItem } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED" | "REFUNDED";

const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }
> = {
  PENDING: { label: "Menunggu", variant: "secondary", icon: Clock },
  PAID: { label: "Berhasil", variant: "default", icon: CheckCircle2 },
  CANCELLED: { label: "Dibatalkan", variant: "destructive", icon: XCircle },
  EXPIRED: { label: "Kedaluwarsa", variant: "outline", icon: AlertCircle },
  FAILED: { label: "Gagal", variant: "destructive", icon: XCircle },
  REFUNDED: { label: "Refund", variant: "outline", icon: Receipt },
};

const methodLabels: Record<string, string> = {
  VIRTUAL_ACCOUNT: "Virtual Account",
  E_WALLET: "E-Wallet",
  CREDIT_CARD: "Kartu Kredit",
  CONVENIENCE_STORE: "Minimarket",
};

interface PaymentTableProps {
  payments: PaymentItem[];
  loading: boolean;
  search: string;
  processingRefund: string | null;
  onProcessRefund: (refundId: string) => void;
}

export function PaymentTable({
  payments,
  loading,
  search,
  processingRefund,
  onProcessRefund,
}: PaymentTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <CreditCard className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            {search ? "Pembayaran tidak ditemukan." : "Belum ada data pembayaran."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Warga</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Metode</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment, idx) => {
              const sc = paymentStatusConfig[payment.status as PaymentStatus] || {
                label: payment.status,
                variant: "outline" as const,
                icon: AlertCircle,
              };
              return (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium text-slate-500">
                    {idx + 1}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-mono text-slate-700 truncate max-w-[140px]">
                      {payment.orderId}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {payment.user?.fullName || "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {payment.user?.email || "—"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">
                    {formatRupiah(Number(payment.amount))}
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {payment.methodCategory
                      ? methodLabels[payment.methodCategory] || payment.methodCategory
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sc.variant} className="text-[10px]">
                      {sc.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {payment.paidAt
                      ? formatDateTime(payment.paidAt)
                      : formatDateTime(payment.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {payment.status === "PAID" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-slate-600 hover:text-slate-900"
                        onClick={() => onProcessRefund(payment.id)}
                        disabled={processingRefund === payment.id}
                      >
                        {processingRefund === payment.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Receipt className="h-3 w-3 mr-1" />
                        )}
                        Refund
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
