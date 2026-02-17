import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { dashboardService, type PaymentItem } from "@/services/dashboardService";

// === HELPERS ===

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

const paymentStatusConfig: Record<PaymentStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof CheckCircle2 }> = {
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

export default function PaymentPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getAllPayments();
      setPayments(data);
    } catch {
      toast.error("Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.orderId.toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // === Handle Process Refund ===
  const handleProcessRefund = async (refundId: string) => {
    if (!confirm("Proses refund untuk transaksi ini?")) return;
    setProcessingRefund(refundId);
    try {
      await dashboardService.processRefund(refundId);
      toast.success("Refund berhasil diproses.");
      fetchPayments();
    } catch {
      toast.error("Gagal memproses refund.");
    } finally {
      setProcessingRefund(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
          Pembayaran
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Riwayat seluruh pembayaran warga melalui payment gateway.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Total Transaksi
            </CardTitle>
            <CreditCard className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-slate-900">{payments.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Berhasil
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-emerald-600">{paidCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Menunggu
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Total Dibayar
            </CardTitle>
            <Receipt className="h-4 w-4 text-brand-green" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-28" /> : (
              <div className="text-xl sm:text-2xl font-bold text-brand-green">
                {formatRupiah(totalPaid)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Cari order ID, nama, atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      {loading ? (
        <Card>
          <CardContent className="py-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <CreditCard className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              {search ? "Pembayaran tidak ditemukan." : "Belum ada data pembayaran."}
            </p>
          </CardContent>
        </Card>
      ) : (
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
                {filteredPayments.map((payment, idx) => {
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
                            onClick={() => handleProcessRefund(payment.id)}
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
      )}
    </div>
  );
}
