import { Card } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { DataTable, type ColumnDef } from "@/shared/components/DataTable";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { formatRupiah, formatDateTime } from "@/shared/helpers/formatters";
import type { PaymentItem } from "@/shared/types";

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
  const columns: ColumnDef<PaymentItem>[] = [
    {
      key: "orderId",
      header: "Order ID",
      render: (payment) => (
        <p className="text-sm font-mono text-slate-700 truncate max-w-[140px]">
          {payment.orderId}
        </p>
      ),
    },
    {
      key: "user",
      header: "Warga",
      render: (payment) => (
        <div>
          <p className="text-sm font-medium text-slate-900">
            {payment.user?.fullName || "—"}
          </p>
          <p className="text-xs text-slate-500">
            {payment.user?.email || "—"}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Jumlah",
      render: (payment) => (
        <span className="font-medium text-slate-900">
          {formatRupiah(Number(payment.amount))}
        </span>
      ),
    },
    {
      key: "method",
      header: "Metode",
      render: (payment) => (
        <span className="text-sm text-slate-500">
          {payment.methodCategory
            ? methodLabels[payment.methodCategory] || payment.methodCategory
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (payment) => {
        const sc = paymentStatusConfig[payment.status as PaymentStatus] || {
          label: payment.status,
          variant: "outline" as const,
          icon: AlertCircle,
        };
        return (
          <Badge variant={sc.variant} className="text-[10px]">
            {sc.label}
          </Badge>
        );
      },
    },
    {
      key: "date",
      header: "Tanggal",
      render: (payment) => (
        <span className="text-sm text-slate-500">
          {payment.paidAt
            ? formatDateTime(payment.paidAt)
            : formatDateTime(payment.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Aksi",
      align: "right",
      render: (payment) =>
        payment.status === "PAID" ? (
          <div onClick={(e) => e.stopPropagation()}>
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
          </div>
        ) : null,
    },
  ];

  return (
    <Card>
      <DataTable
        columns={columns}
        data={payments}
        keyExtractor={(p) => p.id}
        loading={loading}
        showRowNumber
        rowNumberPadded
        emptyIcon={CreditCard}
        emptyTitle={search ? "Pembayaran tidak ditemukan." : "Belum ada data pembayaran."}
      />
    </Card>
  );
}
