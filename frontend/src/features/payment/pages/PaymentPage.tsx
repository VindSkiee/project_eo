import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Input } from "@/shared/ui/input";
import {
  Search,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { paymentService } from "@/features/payment/services/paymentService";
import type { PaymentItem } from "@/shared/types";
import { DateRangeFilter } from "@/shared/components/DateRangeFilter";
import type { DateRange } from "@/shared/components/DateRangeFilter";
import { DataTable } from "@/shared/components/DataTable";
import { formatRupiah, formatDateTime } from "@/shared/helpers/formatters";

type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED" | "REFUNDED";

function getStatusConfig(status: string) {
  const configs: Record<PaymentStatus, {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof CheckCircle2;
    iconClass: string;
    bgClass: string;
  }> = {
    PAID: { label: "Berhasil", variant: "default", icon: CheckCircle2, iconClass: "text-emerald-600", bgClass: "bg-emerald-100" },
    PENDING: { label: "Menunggu", variant: "secondary", icon: Clock, iconClass: "text-amber-600", bgClass: "bg-amber-100" },
    CANCELLED: { label: "Dibatalkan", variant: "destructive", icon: XCircle, iconClass: "text-red-600", bgClass: "bg-red-100" },
    EXPIRED: { label: "Kedaluwarsa", variant: "outline", icon: AlertCircle, iconClass: "text-slate-500", bgClass: "bg-slate-100" },
    FAILED: { label: "Gagal", variant: "destructive", icon: XCircle, iconClass: "text-red-600", bgClass: "bg-red-100" },
    REFUNDED: { label: "Refund", variant: "outline", icon: RotateCcw, iconClass: "text-blue-600", bgClass: "bg-blue-100" },
  };
  return configs[status as PaymentStatus] || {
    label: status,
    variant: "outline" as const,
    icon: AlertCircle,
    iconClass: "text-slate-500",
    bgClass: "bg-slate-100",
  };
}

function getTransactionLabel(orderId: string): string {
  const id = orderId.toUpperCase();
  if (id.includes("DUES")) return "Pembayaran Iuran";
  if (id.includes("FUND")) return "Pendanaan Kegiatan";
  if (id.includes("REFUND")) return "Pengembalian Dana";
  if (id.includes("EVENT")) return "Pembayaran Event";
  return "Transaksi Pembayaran";
}

function getTransactionIcon(orderId: string) {
  const id = orderId.toUpperCase();
  if (id.includes("DUES")) return { icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-100" };
  if (id.includes("REFUND")) return { icon: RotateCcw, color: "text-blue-600", bg: "bg-blue-100" };
  if (id.includes("FUND")) return { icon: ArrowUpRight, color: "text-amber-600", bg: "bg-amber-100" };
  return { icon: CreditCard, color: "text-primary", bg: "bg-primary/10" };
}

const methodLabels: Record<string, string> = {
  VIRTUAL_ACCOUNT: "Virtual Account",
  E_WALLET: "E-Wallet",
  CREDIT_CARD: "Kartu Kredit",
  CONVENIENCE_STORE: "Minimarket",
  QRIS: "QRIS",
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"today" | "all">("today");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Role-aware navigation
  const userRole = (() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) return JSON.parse(stored).role;
    } catch { /* ignore */ }
    return null;
  })();

  const getDetailPath = (paymentId: string) => {
    if (userRole === "LEADER") return `/dashboard/pembayaran/${paymentId}`;
    if (userRole === "ADMIN") return `/dashboard/pembayaran-rt/${paymentId}`;
    if (userRole === "TREASURER") return `/dashboard/pembayaran-bendahara/${paymentId}`;
    return `/dashboard/pembayaran-warga/${paymentId}`;
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getAll();
      setPayments(data);
    } catch {
      toast.error("Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchSearch =
      p.orderId.toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.email || "").toLowerCase().includes(search.toLowerCase()) ||
      getTransactionLabel(p.orderId).toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    const paymentDate = new Date(p.createdAt);
    if (filterTab === "today") {
      const today = new Date();
      if (
        paymentDate.getDate() !== today.getDate() ||
        paymentDate.getMonth() !== today.getMonth() ||
        paymentDate.getFullYear() !== today.getFullYear()
      ) return false;
    }
    if (dateRange?.from) {
      const d = new Date(paymentDate);
      d.setHours(0, 0, 0, 0);
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      if (d < from) return false;
      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
    }
    return true;
  });

  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const failedCount = payments.filter((p) => p.status === "FAILED" || p.status === "CANCELLED" || p.status === "EXPIRED").length;
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

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
              Gagal/Batal
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total Paid Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/80 font-poppins">
            Total Pembayaran Berhasil
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-40 bg-white/20" />
          ) : (
            <div className="text-3xl sm:text-4xl font-bold">
              {formatRupiah(totalPaid)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search & Count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 font-poppins">
            Riwayat Transaksi
          </h2>
          <p className="text-xs text-slate-500">
            {paidCount} berhasil · {pendingCount} menunggu · {failedCount} gagal/batal
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end items-center">
          <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
            <button
              onClick={() => { setFilterTab("today"); setDateRange(undefined); }}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterTab === "today" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setFilterTab("all")}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filterTab === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Semua
            </button>
          </div>
          {filterTab === "all" && (
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              placeholder="Filter tanggal"
            />
          )}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari order ID atau nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Transaction List — styled like FinancePage */}
      <Card>
        <DataTable<PaymentItem>
          columns={[
            {
              key: "transaction",
              header: "Transaksi",
              render: (payment) => {
                const txIcon = getTransactionIcon(payment.orderId);
                const TxIcon = txIcon.icon;
                return (
                  <div className="flex items-center gap-2.5">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${txIcon.bg}`}>
                      <TxIcon className={`h-4 w-4 ${txIcon.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {getTransactionLabel(payment.orderId)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {payment.user?.fullName || "—"}
                        <span className="text-slate-400 hidden sm:inline"> · {payment.orderId}</span>
                      </p>
                    </div>
                  </div>
                );
              },
            },
            {
              key: "method",
              header: "Metode",
              hideBelow: "sm",
              render: (payment) => (
                <span className="text-xs text-slate-500">
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
                const sc = getStatusConfig(payment.status);
                return (
                  <Badge variant={sc.variant} className="text-[10px]">
                    {sc.label}
                  </Badge>
                );
              },
            },
            {
              key: "amount",
              header: "Jumlah",
              render: (payment) => (
                <span className={`font-medium text-sm ${
                  payment.status === "PAID" ? "text-emerald-600" :
                  payment.status === "REFUNDED" ? "text-blue-600" :
                  "text-slate-900"
                }`}>
                  {formatRupiah(Number(payment.amount))}
                </span>
              ),
            },
            {
              key: "date",
              header: "Tanggal",
              hideBelow: "md",
              render: (payment) => (
                <span className="text-sm text-slate-500">
                  {payment.paidAt
                    ? formatDateTime(payment.paidAt)
                    : formatDateTime(payment.createdAt)}
                </span>
              ),
            },
          ]}
          data={filteredPayments}
          keyExtractor={(p) => p.id}
          loading={loading}
          showRowNumber
          rowNumberPadded
          onRowClick={(payment) => navigate(getDetailPath(payment.id))}
          emptyIcon={CreditCard}
          emptyTitle={search ? "Pembayaran tidak ditemukan." : filterTab === "today" ? "Belum ada pembayaran hari ini." : "Belum ada data pembayaran."}
        />
      </Card>
    </div>
  );
}
