import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import {
  ArrowLeft,
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  CreditCard,
  Calendar,
  Hash,
  Wallet,
  User,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { paymentService } from "@/features/payment/services/paymentService";
import type { PaymentItem } from "@/shared/types";

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
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status: string) {
  switch (status) {
    case "PAID":
      return {
        label: "Pembayaran Berhasil",
        variant: "default" as const,
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        gradient: "from-emerald-500 to-teal-600",
        description: "Transaksi telah berhasil dan dana sudah diterima.",
      };
    case "PENDING":
      return {
        label: "Menunggu Pembayaran",
        variant: "outline" as const,
        icon: Clock,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        gradient: "from-amber-500 to-orange-500",
        description: "Silakan selesaikan pembayaran Anda sebelum batas waktu.",
        badgeClassName: "bg-yellow-50 text-yellow-700 border-yellow-200",
      };
    case "FAILED":
      return {
        label: "Pembayaran Gagal",
        variant: "destructive" as const,
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        gradient: "from-red-500 to-rose-600",
        description: "Transaksi gagal diproses. Silakan coba lagi.",
      };
    case "EXPIRED":
      return {
        label: "Kedaluwarsa",
        variant: "outline" as const,
        icon: Clock,
        color: "text-slate-500",
        bg: "bg-slate-50",
        border: "border-slate-200",
        gradient: "from-slate-400 to-slate-500",
        description: "Batas waktu pembayaran telah habis.",
      };
    case "CANCELLED":
      return {
        label: "Dibatalkan",
        variant: "outline" as const,
        icon: XCircle,
        color: "text-slate-500",
        bg: "bg-slate-50",
        border: "border-slate-200",
        gradient: "from-slate-400 to-slate-500",
        description: "Transaksi ini telah dibatalkan.",
      };
    default:
      return {
        label: status,
        variant: "outline" as const,
        icon: Clock,
        color: "text-slate-500",
        bg: "bg-slate-50",
        border: "border-slate-200",
        gradient: "from-slate-400 to-slate-500",
        description: "",
      };
  }
}

function getMethodLabel(method?: string): string {
  const labels: Record<string, string> = {
    VIRTUAL_ACCOUNT: "Virtual Account",
    E_WALLET: "E-Wallet",
    CREDIT_CARD: "Kartu Kredit",
    CONVENIENCE_STORE: "Minimarket",
    QRIS: "QRIS",
  };
  return labels[method || ""] || method || "-";
}

function getProviderLabel(provider?: string): string {
  const labels: Record<string, string> = {
    bca: "BCA",
    bni: "BNI",
    bri: "BRI",
    mandiri: "Mandiri",
    permata: "Permata",
    gopay: "GoPay",
    shopeepay: "ShopeePay",
    qris: "QRIS",
    credit_card: "Kartu Kredit",
    cstore: "Minimarket",
  };
  return labels[provider || ""] || provider || "-";
}

// === MAIN COMPONENT ===

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const fetchPayment = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await paymentService.getPaymentDetails(id);
      setPayment(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memuat detail pembayaran";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleSyncStatus = async () => {
    if (!payment?.orderId) return;
    setSyncing(true);
    try {
      const result = await paymentService.syncPayment(payment.orderId);
      if (result.updated) {
        toast.success(`Status diperbarui: ${result.status}`);
        await fetchPayment(); // Reload data terbaru
      } else {
        toast.info(result.message || "Pembayaran masih pending di Midtrans.");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || (err instanceof Error ? err.message : "Gagal mengecek status");
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} berhasil disalin`);
    });
  };

  const goBack = () => {
    navigate(-1);
  };

  // === LOADING STATE ===
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // === ERROR / NOT FOUND STATE ===
  if (error || !payment) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <ArrowLeft className="h-4 w-4 mr-1" onClick={goBack} />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <XCircle className="h-12 w-12 text-slate-300 mb-4" />
            <p className="text-lg font-semibold text-slate-600 font-poppins">
              Transaksi Tidak Ditemukan
            </p>
            <p className="text-sm text-slate-400 mt-1 max-w-sm">
              {error || "Data pembayaran yang Anda cari tidak tersedia atau Anda tidak memiliki akses."}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={goBack}>
              Kembali ke Pembayaran
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const status = getStatusConfig(payment.status);
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">

        <ArrowLeft className="h-4 w-4 mr-1" onClick={goBack} />

        <h1 className="text-xl sm:text-2xl font-bold font-poppins text-slate-900">
          Detail Transaksi
        </h1>
      </div>

      {/* Status Banner */}
      <Card className={`bg-gradient-to-r overflow-hidden ${status.gradient}`}>
        <div className="p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <StatusIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-poppins">{status.label}</h2>
              <p className="text-sm text-white/80">{status.description}</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-white/70 uppercase tracking-wide">Jumlah Pembayaran</p>
            <p className="text-3xl sm:text-4xl font-bold font-poppins mt-1">
              {formatRupiah(Number(payment.amount))}
            </p>
          </div>
        </div>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Receipt className="h-4 w-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
              Informasi Transaksi
            </h3>
          </div>

          <Separator />


          {/* User Info */}
          {payment.user && (
            <>

              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Pembayar</p>
                  <p className="text-sm font-medium text-slate-900">{payment.user.fullName}</p>
                  <p className="text-xs text-slate-400">{payment.user.email}</p>
                </div>
              </div>
            </>
          )}

          {/* Status */}
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Status</p>
              <Badge variant={status.variant} className={`mt-0.5 ${(status as { badgeClassName?: string }).badgeClassName ?? ""}`}>
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Amount */}
          <div className="flex items-center gap-2.5">
            <Wallet className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Jumlah</p>
              <p className="text-sm font-semibold text-slate-900">{formatRupiah(Number(payment.amount))}</p>
              {payment.grossAmount && Number(payment.grossAmount) !== Number(payment.amount) && (
                <p className="text-xs text-slate-400">
                  Gross: {formatRupiah(Number(payment.grossAmount))}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Method */}
          {payment.methodCategory && (
            <div className="flex items-center gap-2.5">
              <CreditCard className="h-4 w-4 text-slate-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Metode Pembayaran</p>
                <p className="text-sm font-medium text-slate-900">
                  {getMethodLabel(payment.methodCategory)}
                  {payment.providerCode && (
                    <span className="text-slate-500"> — {getProviderLabel(payment.providerCode)}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* VA Number */}
          {payment.vaNumber && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <CreditCard className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Nomor Virtual Account</p>
                  <p className="text-sm font-mono font-medium text-slate-900 break-all">{payment.vaNumber}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => copyToClipboard(payment.vaNumber!, "No. VA")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Midtrans Transaction ID */}
          {payment.midtransId && (
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <ExternalLink className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Midtrans Transaction ID</p>
                  <p className="text-sm font-medium text-black break-all">{payment.midtransId}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => copyToClipboard(payment.midtransId!, "Transaction ID")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
          {/* Order ID */}
          <div className="flex items-start justify-between gap-3">

            <div className="flex items-start gap-2.5 min-w-0">
              <Hash className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Order ID</p>
                <p className="text-sm font-medium text-slate-900 break-all">{payment.orderId}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => copyToClipboard(payment.orderId, "Order ID")}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>

          <Separator />

          {/* Dates */}
          <div className="flex items-center gap-2.5">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Tanggal Transaksi</p>
              <p className="text-sm font-medium text-slate-900">{formatDateTime(payment.createdAt)}</p>
            </div>
          </div>

          {payment.paidAt && (
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Tanggal Pembayaran</p>
                <p className="text-sm font-medium text-emerald-700">{formatDateTime(payment.paidAt)}</p>
              </div>
            </div>
          )}


        </CardContent>
      </Card>

      {/* Action Button — Resume payment if PENDING */}
      {payment.status === "PENDING" && (
        <Card className={`${status.border} ${status.bg}`}>
          <CardContent className="py-4 px-5 space-y-3">
            <div className="flex items-start gap-2.5">
              <Clock className={`h-5 w-5 ${status.color} mt-0.5 shrink-0`} />
              <div>
                <p className="text-sm font-semibold text-slate-800">Selesaikan Pembayaran</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sudah bayar tapi status masih pending? Klik "Cek Status" untuk memperbarui.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              {/* Sync / Cek Status button — polls Midtrans directly */}
              <Button
                variant="outline"
                size="sm"
                className="border-amber-400 text-amber-700 hover:bg-amber-50"
                onClick={handleSyncStatus}
                disabled={syncing}
              >
                <RefreshCw className={`h-4 w-4 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Mengecek..." : "Cek Status Pembayaran"}
              </Button>
              {/* Resume payment button */}
              {payment.redirectUrl && (
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => window.open(payment.redirectUrl!, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Lanjutkan Bayar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Note */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 pb-4">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Pembayaran diproses secara aman melalui Midtrans</span>
      </div>
    </div>
  );
}
