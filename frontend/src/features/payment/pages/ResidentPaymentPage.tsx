import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import {
  CreditCard,
  Search,
  Receipt,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  FileText,
  AlertTriangle,
  QrCode,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import { paymentService } from "@/features/payment/services/paymentService";
import type { MyBill, PaymentItem } from "@/shared/types";

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
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusConfig(status: string) {
  switch (status) {
    case "PAID":
      return { label: "Berhasil", variant: "default" as const, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" };
    case "PENDING":
      return { label: "Menunggu", variant: "secondary" as const, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" };
    case "FAILED":
      return { label: "Gagal", variant: "destructive" as const, icon: XCircle, color: "text-red-600", bg: "bg-red-50" };
    case "EXPIRED":
      return { label: "Kedaluwarsa", variant: "outline" as const, icon: Clock, color: "text-slate-500", bg: "bg-slate-50" };
    case "CANCELLED":
      return { label: "Dibatalkan", variant: "outline" as const, icon: XCircle, color: "text-slate-500", bg: "bg-slate-50" };
    default:
      return { label: status, variant: "outline" as const, icon: Clock, color: "text-slate-500", bg: "bg-slate-50" };
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

// === CONSTANTS ===

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const MONTH_SHORT_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// === Midtrans Snap Loader ===

const MIDTRANS_SNAP_URL = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === "true"
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js";
const MIDTRANS_CLIENT_KEY = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || "";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

function loadMidtransSnap(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.snap) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src*="snap.js"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = MIDTRANS_SNAP_URL;
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap"));
    document.head.appendChild(script);
  });
}

// === MAIN COMPONENT ===

export default function ResidentPaymentPage() {
  const navigate = useNavigate();
  const [bill, setBill] = useState<MyBill | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paying, setPaying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedMonthCount, setSelectedMonthCount] = useState(1);
  const payingRef = useRef(false); // Prevent double-click

  const fetchBill = useCallback(async () => {
    try {
      const data = await financeService.getMyBill();
      setBill(data);
    } catch {
      // Bill might not be available — that's OK
      setBill(null);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoadingPayments(true);
    try {
      const data = await paymentService.getHistory();
      setPayments(data);
    } catch {
      toast.error("Gagal memuat riwayat pembayaran.");
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.allSettled([fetchBill(), fetchPayments()]);
      setLoading(false);
    };
    init();
    // Preload Midtrans Snap
    loadMidtransSnap().catch(() => {});
  }, [fetchBill, fetchPayments]);

  // Reset month selection whenever bill data changes
  useEffect(() => {
    setSelectedMonthCount(1);
  }, [bill?.nextBillMonth, bill?.nextBillYear]);

  // Daftar bulan Jan–Des tahun tagihan — capped ke Desember (tidak melewati tahun ini)
  const monthGrid = useMemo(() => {
    const startMonth = bill?.nextBillMonth ?? (new Date().getMonth() + 1);
    const year       = bill?.nextBillYear  ?? new Date().getFullYear();
    // Jumlah bulan yang bisa dipilih maksimal sampai Desember
    const maxSelectable = 12 - startMonth + 1; // 1 = hanya bulan ini, dst.
    return {
      months: Array.from({ length: 12 }, (_, i) => {
        const m      = i + 1; // 1-12
        const offset = m - startMonth; // <0=paid, 0=locked, >0=selectable
        const state  = offset < 0 ? "paid" : offset === 0 ? "locked" : "selectable";
        const isChecked = state !== "paid" && offset < selectedMonthCount;
        return { month: m, year, label: MONTH_NAMES_ID[i], short: MONTH_SHORT_ID[i], state, offset, isChecked };
      }),
      maxSelectable,
      startMonth,
      year,
    };
  }, [bill?.nextBillMonth, bill?.nextBillYear, selectedMonthCount]);

  // Toggle bulan — hanya dalam tahun berjalan (maks Desember)
  const handleMonthToggle = (m: number) => {
    const startMonth = monthGrid.startMonth;
    if (m < startMonth) return; // paid — locked
    if (m === startMonth) return; // wajib — locked
    const offset = m - startMonth; // 1+
    // Cegah memilih melebihi Desember
    if (offset >= monthGrid.maxSelectable) return;
    if (offset < selectedMonthCount) {
      setSelectedMonthCount(offset);     // uncheck ini dan ke atas
    } else {
      setSelectedMonthCount(offset + 1); // check sampai bulan ini
    }
  };

  // === SYNC PENDING PAYMENT FROM MIDTRANS ===
  const handleSyncPending = async () => {
    if (!pendingPayment) return;
    setSyncing(true);
    try {
      const result = await paymentService.syncPayment(pendingPayment.orderId);
      if (result.updated) {
        toast.success(`Status diperbarui: ${result.status}`);
        await Promise.allSettled([fetchBill(), fetchPayments()]);
      } else {
        toast.info(result.message || "Pembayaran masih pending di Midtrans. Silakan selesaikan pembayaran terlebih dahulu.");
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Gagal mengecek status");
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  // === PAYMENT HANDLER ===
  const handlePayDues = async () => {
    setShowConfirmDialog(false);

    // Double-click prevention
    if (payingRef.current) return;
    payingRef.current = true;
    setPaying(true);

    try {
      // 1. Ensure Snap is loaded
      await loadMidtransSnap();

      // 2. Create payment on backend
      const result = await paymentService.payDues(selectedMonthCount);

      if (!result.token) {
        throw new Error("Token pembayaran tidak diterima");
      }

      // 3. Open Midtrans Snap popup
      window.snap?.pay(result.token, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil!");
          navigate("/dashboard/warga?payment=success", { replace: true });
        },
        onPending: () => {
          toast.info("Pembayaran sedang diproses. Silakan selesaikan pembayaran Anda.");
          fetchPayments();
          fetchBill();
        },
        onError: () => {
          toast.error("Pembayaran gagal. Silakan coba lagi.");
          fetchPayments();
        },
        onClose: () => {
          toast.info("Pembayaran dibatalkan.");
          fetchPayments();
          fetchBill();
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal memproses pembayaran";
      toast.error(message);
    } finally {
      setPaying(false);
      payingRef.current = false;
    }
  };

  const hasUnpaidBill = bill !== null && bill.totalAmount > 0;
  const pendingPayment = payments.find((p) => p.status === "PENDING" && p.orderId.startsWith("DUES-"));
  const hasPendingPayment = !!pendingPayment;
  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.amount), 0);

  const filteredPayments = payments.filter(
    (p) =>
      p.orderId.toLowerCase().includes(search.toLowerCase()) ||
      p.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">Pembayaran</h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Kelola iuran dan lihat riwayat pembayaran Anda.
          </p>
        </div>
      </div>

      {/* === INVOICE / TAGIHAN SECTION === */}
      {loading ? (
        <Skeleton className="h-52 w-full rounded-xl" />
      ) : hasUnpaidBill ? (
        <Card className="rounded-xl shadow-sm bg-slate-100 border border-black">
          <div className="bg-slate-100 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <p className="text-sm sm:text-base font-semibold text-slate-700 uppercase tracking-wide">Nota Tagihan Iuran</p>
            </div>

            {/* Invoice Detail — per-month base amounts */}
            <div className="bg-slate-200 rounded-lg p-4 sm:p-5 border border-slate-100 mb-4">
              <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">Rincian iuran / bulan</p>
              <div className="space-y-3">
                {bill?.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm sm:text-base font-medium text-slate-700">Iuran {item.type}</p>
                      <p className="text-xs sm:text-sm text-slate-400">{item.groupName}</p>
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-slate-900 font-poppins">{formatRupiah(item.amount)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Month Selector — only when no pending transaction */}
            {!hasPendingPayment && (
              <div className="bg-slate-200 border border-slate-100 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center mb-7 mt-7">
                  <p className="text-sm text-center font-semibold text-slate-700 uppercase tracking-widest">
                    Pilih bulan yang ingin dibayar
                  </p>
                </div>

                {/* Horizontal progress blocks */}
                <div className="overflow-x-auto pb-1">
                  <div className="flex items-stretch gap-0 min-w-max justify-center">
                    {monthGrid.months.map((m, idx) => {
                      const isLast = idx === 11;
                      return (
                        <div key={m.month} className="flex items-center">
                          <button
                            type="button"
                            disabled={m.state === "paid" || m.state === "locked"}
                            onClick={() => handleMonthToggle(m.month)}
                            aria-pressed={m.isChecked}
                            aria-label={`${
                              m.state === "paid" ? "Lunas" :
                              m.state === "locked" ? "Wajib" : m.isChecked ? "Dipilih" : "Pilih"
                            } ${m.label}`}
                            className={`flex flex-col items-center gap-1 px-3 py-2 sm:px-2.5 rounded-lg
                              transition-all duration-150 select-none min-w-[56px] sm:min-w-[52px]
                              ${
                                m.state === "paid"
                                  ? "cursor-default text-slate-600"
                                  : m.state === "locked"
                                  ? "cursor-default text-black"
                                  : m.isChecked
                                  ? "cursor-pointer text-black hover:bg-emerald-500/10"
                                  : "cursor-pointer text-slate-400 hover:text-black"
                              }`}
                          >
                            {/* Checkbox ring */}
                            <span className={`h-6 w-6 sm:h-5 sm:w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                              ${
                                m.state === "paid"
                                  ? "border-slate-600 bg-slate-700/50"
                                  : m.state === "locked"
                                  ? "border-amber-400 bg-amber-400"
                                  : m.isChecked
                                  ? "border-emerald-500 bg-emerald-500"
                                  : "border-slate-500 bg-transparent"
                              }`}
                            >
                              {(m.state === "paid" || m.state === "locked" || m.isChecked) && (
                                <Check className="h-3 w-3 sm:h-2.5 sm:w-2.5 text-white" strokeWidth={3} />
                              )}
                            </span>

                            {/* Short month name */}
                            <span className="text-xs sm:text-[11px] font-medium leading-none">{m.short}</span>

                            {/* Badge */}
                            {m.state === "locked" && (
                              <span className="text-[8px] text-black leading-none">wajib</span>
                            )}
                            {m.state === "paid" && (
                              <span className="text-[8px] text-slate-600 leading-none">lunas</span>
                            )}
                          </button>

                          {/* Connector line between months */}
                          {!isLast && (
                            <div className={`h-0.5 w-3 shrink-0 rounded-full transition-colors
                              ${
                                m.isChecked && monthGrid.months[idx + 1].isChecked
                                  ? "bg-emerald-500"
                                  : m.state === "paid" && (monthGrid.months[idx + 1].state === "paid" || monthGrid.months[idx + 1].state === "locked")
                                  ? "bg-slate-700"
                                  : "bg-white/10"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic total + year hint */}
                <div className="border-t border-slate-100 mt-3 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm text-slate-700 font-medium">
                      {selectedMonthCount} bulan dipilih
                    </span>
                    {monthGrid.maxSelectable === selectedMonthCount && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Sudah maks untuk tahun {monthGrid.year}. Sisa bulan dapat dibayar tahun depan.
                      </p>
                    )}
                    {selectedMonthCount > 1 && monthGrid.maxSelectable > selectedMonthCount && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {MONTH_NAMES_ID[(monthGrid.startMonth) - 1]}–{MONTH_NAMES_ID[(monthGrid.startMonth) + selectedMonthCount - 2]}
                      </p>
                    )}
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-emerald-500 font-poppins">
                    {formatRupiah(bill!.totalAmount * selectedMonthCount)}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-600 mb-4">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-600" />
              <span className="text-slate-600">{bill?.dueDateDescription} &middot; Pembayaran aman via Midtrans</span>
            </div>

            {/* Pending Payment Warning */}
            {hasPendingPayment && (
              <div className="flex flex-col gap-2 bg-amber-500/20 border border-amber-400/30 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0" />
                  <div className="text-xs text-amber-200">
                    <p className="font-medium">Ada pembayaran yang belum selesai</p>
                    <p className="mt-0.5 text-amber-300/80">Sudah bayar tapi status masih pending? Klik "Cek Status" untuk memperbarui.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-amber-400/50 text-amber-200 hover:bg-amber-500/20 hover:text-amber-100 bg-transparent"
                  onClick={handleSyncPending}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Mengecek status..." : "Cek Status Pembayaran"}
                </Button>
              </div>
            )}

            {/* Payment Method Info */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg p-3 mb-5">
              <QrCode className="h-4 w-4 text-emerald-500 shrink-0" />
              <p className="text-xs text-slate-700">
                Metode pembayaran utama: <span className="font-semibold text-slate-900">QRIS</span> — Bisa scan dari aplikasi e-wallet manapun (GoPay, OVO, Dana, ShopeePay, dll)
              </p>
            </div>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base h-12 shadow-lg shadow-emerald-500/20"
              disabled={paying}
              onClick={() => setShowConfirmDialog(true)}
            >
              {paying ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : hasPendingPayment ? (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Lanjutkan Pembayaran
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Bayar {selectedMonthCount > 1 ? `${selectedMonthCount} Bulan` : "Sekarang"} &mdash; {formatRupiah((bill?.totalAmount || 0) * selectedMonthCount)}
                </>
              )}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="py-6 px-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-emerald-800 font-poppins">Semua Iuran Lunas!</p>
                <p className="text-sm text-emerald-600 mt-0.5">
                  Tidak ada tagihan yang perlu dibayar saat ini.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === SUMMARY CARDS === */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Transaksi</p>
              <p className="text-lg font-bold text-slate-900">{loadingPayments ? "..." : payments.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Berhasil Dibayar</p>
              <p className="text-lg font-bold text-slate-900">{loadingPayments ? "..." : paidCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Dibayarkan</p>
              <p className="text-lg font-bold text-slate-900">{loadingPayments ? "..." : formatRupiah(totalPaid)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === PAYMENT HISTORY === */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-slate-800 font-poppins">Riwayat Pembayaran</h2>
          <div className="relative max-w-sm w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari order ID atau status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
        </div>

        {loadingPayments ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : filteredPayments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CreditCard className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                {search ? "Pembayaran tidak ditemukan" : "Belum ada riwayat pembayaran"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {search ? "Coba kata kunci lain" : "Riwayat pembayaran Anda akan tampil di sini."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredPayments.map((payment) => {
              const status = getStatusConfig(payment.status);
              const StatusIcon = status.icon;
              return (
                <Card
                  key={payment.id}
                  className="cursor-pointer hover:shadow-md transition-all hover:border-primary/20 group"
                  onClick={() => navigate(`/dashboard/pembayaran-warga/${payment.id}`)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg ${status.bg} flex items-center justify-center shrink-0`}>
                        <StatusIcon className={`h-5 w-5 ${status.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
                              {payment.orderId}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(payment.createdAt)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-900">{formatRupiah(Number(payment.amount))}</p>
                            <Badge variant={status.variant} className="text-[10px] mt-0.5">
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                        {payment.methodCategory && (
                          <p className="text-xs text-slate-400 mt-1">{getMethodLabel(payment.methodCategory)}</p>
                        )}
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-300 shrink-0 group-hover:text-primary transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* === CONFIRM PAYMENT DIALOG === */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-poppins">
              {hasPendingPayment
                ? "Lanjutkan Pembayaran"
                : selectedMonthCount > 1
                ? `Konfirmasi Pembayaran ${selectedMonthCount} Bulan`
                : "Konfirmasi Pembayaran"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              {hasPendingPayment ? (
                <span className="block text-amber-600 font-medium">
                  Anda memiliki pembayaran yang belum selesai. Klik lanjutkan untuk menyelesaikan pembayaran.
                </span>
              ) : (
                <span className="block">
                  Anda akan membayar iuran untuk{" "}
                  <span className="font-semibold text-slate-900">{selectedMonthCount} bulan</span>
                  :
                </span>
              )}

              {!hasPendingPayment && monthGrid.months.filter((m) => m.isChecked).map((m) => (
                <span key={m.month} className="flex items-center gap-2 text-sm">
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="text-slate-600">{m.label} {m.year}</span>
                </span>
              ))}

              {!hasPendingPayment && (
                <span className="block mt-1 pt-2 border-t">
                  {bill?.breakdown.map((item, idx) => (
                    <span key={idx} className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-500">Iuran {item.type} × {selectedMonthCount}</span>
                      <span className="font-medium text-slate-800">{formatRupiah(item.amount * selectedMonthCount)}</span>
                    </span>
                  ))}
                </span>
              )}

              <span className="flex items-center justify-between text-base font-bold border-t pt-2">
                <span className="text-slate-800">Total</span>
                <span className="text-primary">{formatRupiah((bill?.totalAmount || 0) * (hasPendingPayment ? 1 : selectedMonthCount))}</span>
              </span>

              <span className="block mt-3 p-2 bg-slate-50 rounded-lg border">
                <span className="flex items-center gap-2 text-xs text-slate-600">
                  <QrCode className="h-3.5 w-3.5 text-emerald-500" />
                  Pembayaran utama via <span className="font-semibold">QRIS</span> — scan dari e-wallet manapun
                </span>
              </span>

              <span className="block text-xs text-slate-400 mt-2">
                Anda akan diarahkan ke halaman pembayaran Midtrans yang aman.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePayDues} className="bg-emerald-600 hover:bg-emerald-700">
              <ShieldCheck className="h-4 w-4 mr-1" />
              {hasPendingPayment ? "Lanjutkan Pembayaran" : "Bayar Sekarang"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
