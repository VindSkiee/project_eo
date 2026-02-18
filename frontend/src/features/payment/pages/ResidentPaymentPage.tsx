import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  ArrowLeft,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ShieldCheck,
  ArrowRight,
  FileText,
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
  const [search, setSearch] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
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
      const result = await paymentService.payDues();

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
  const hasPendingPayment = payments.some((p) => p.status === "PENDING");
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
        <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/warga")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
        </Button>
      </div>

      {/* === INVOICE / TAGIHAN SECTION === */}
      {loading ? (
        <Skeleton className="h-52 w-full rounded-xl" />
      ) : hasUnpaidBill ? (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-slate-300" />
              <p className="text-sm font-medium text-slate-300 uppercase tracking-wide">Nota Tagihan Iuran</p>
            </div>

            {/* Invoice Detail */}
            <div className="bg-white/10 rounded-xl p-4 sm:p-5 backdrop-blur-sm border border-white/10 mb-5">
              <div className="space-y-3">
                {bill?.breakdown.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Iuran {item.type}</p>
                      <p className="text-xs text-slate-400">{item.groupName}</p>
                    </div>
                    <p className="text-lg font-bold text-white font-poppins">{formatRupiah(item.amount)}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/20 mt-4 pt-4 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">Total Tagihan</p>
                <p className="text-2xl sm:text-3xl font-bold text-white font-poppins">{formatRupiah(bill?.totalAmount || 0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 mb-5">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{bill?.dueDateDescription} &middot; Pembayaran aman via Midtrans</span>
            </div>

            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-base h-12 shadow-lg shadow-emerald-500/20"
              disabled={paying || hasPendingPayment}
              onClick={() => setShowConfirmDialog(true)}
            >
              {paying ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : hasPendingPayment ? (
                <>
                  <Clock className="h-5 w-5 mr-2" />
                  Ada Pembayaran Pending
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Bayar Sekarang
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
            <AlertDialogTitle className="font-poppins">Konfirmasi Pembayaran</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">Anda akan membayar iuran bulanan sebesar:</span>

              {bill?.breakdown.map((item, idx) => (
                <span key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Iuran {item.type} ({item.groupName})</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(item.amount)}</span>
                </span>
              ))}

              <span className="flex items-center justify-between text-base font-bold border-t pt-2">
                <span className="text-slate-800">Total</span>
                <span className="text-primary">{formatRupiah(bill?.totalAmount || 0)}</span>
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
              Lanjutkan Pembayaran
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
