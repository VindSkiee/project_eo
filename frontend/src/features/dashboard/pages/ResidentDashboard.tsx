import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
import {
  Wallet,
  CreditCard,
  ArrowRight,
  CalendarDays,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  PartyPopper,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import { eventService } from "@/features/event/services/eventService";
import { paymentService } from "@/features/payment/services/paymentService";
import type { TransparencyBalance, MyBill, EventItem, PaymentItem } from "@/shared/types";

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

function getEventStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    APPROVED: "Disetujui",
    FUNDED: "Didanai",
    ONGOING: "Berlangsung",
    COMPLETED: "Selesai",
  };
  return labels[status] || status;
}

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [balance, setBalance] = useState<TransparencyBalance | null>(null);
  const [bill, setBill] = useState<MyBill | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const user = (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // Check for payment success redirect
  useEffect(() => {
    if (searchParams.get("payment") === "success") {
      setShowSuccessPopup(true);
      setSearchParams({}, { replace: true });
      const timer = setTimeout(() => setShowSuccessPopup(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [balanceData, billData, eventsData, paymentsData] = await Promise.allSettled([
          financeService.getTransparencyBalance(),
          financeService.getMyBill(),
          eventService.getAll(),
          paymentService.getHistory(),
        ]);

        if (balanceData.status === "fulfilled") setBalance(balanceData.value);
        if (billData.status === "fulfilled") setBill(billData.value);
        if (eventsData.status === "fulfilled") setEvents(eventsData.value);
        if (paymentsData.status === "fulfilled") {
          const pending = paymentsData.value.filter(
            (p: PaymentItem) => p.status === "PENDING" && p.orderId.startsWith("DUES-")
          );
          setPendingPayments(pending);
        }
      } catch {
        toast.error("Terjadi kesalahan saat memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const hasUnpaidBill = bill !== null && bill.totalAmount > 0;
  const approvedEvents = events.filter((e) =>
    ["APPROVED", "FUNDED", "ONGOING", "COMPLETED"].includes(e.status)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Payment Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-sm mx-4 shadow-2xl border-0 overflow-hidden">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white font-poppins">Pembayaran Berhasil!</h2>
              <p className="text-emerald-100 text-sm mt-1">
                Iuran bulanan Anda telah berhasil dibayarkan.
              </p>
            </div>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-slate-500">
                Terima kasih atas kontribusi Anda untuk lingkungan.
              </p>
              <Button
                size="sm"
                className="mt-3"
                onClick={() => setShowSuccessPopup(false)}
              >
                Tutup
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
          Halo, {user?.fullName || "Warga"}! 👋
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Selamat datang di portal informasi warga.
        </p>
      </div>

      {/* === PENDING PAYMENT REMINDER === */}
      {!loading && pendingPayments.length > 0 && (
        <Card className="border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-50 overflow-hidden shadow-md animate-in slide-in-from-top duration-500">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 sm:p-6">
              <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 font-poppins">
                  Pembayaran Menunggu Penyelesaian
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  Anda memiliki {pendingPayments.length} pembayaran iuran yang belum diselesaikan.
                  Segera selesaikan agar iuran tercatat.
                </p>
                <div className="mt-2 space-y-1">
                  {pendingPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-xs">
                      <span className="text-amber-700 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {p.orderId.length > 30 ? p.orderId.substring(0, 30) + "..." : p.orderId}
                      </span>
                      <span className="font-semibold text-amber-800">{formatRupiah(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 shrink-0 w-full sm:w-auto"
                onClick={() => navigate("/dashboard/pembayaran-warga")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Bayar Sekarang
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === TAGIHAN IURAN (Prominent) === */}
      {loading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : hasUnpaidBill ? (
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div className="flex-1 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-red-800 font-poppins">Tagihan Iuran Bulanan</p>
                    <p className="text-xs text-red-500">{bill?.dueDateDescription}</p>
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-red-700 mb-3 font-poppins">
                  {formatRupiah(bill?.totalAmount || 0)}
                </div>
                {bill?.breakdown && bill.breakdown.length > 0 && (
                  <div className="space-y-1.5 mb-4">
                    {bill.breakdown.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-red-600/80">Iuran {item.type} — {item.groupName}</span>
                        <span className="font-semibold text-red-700">{formatRupiah(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 w-full sm:w-auto"
                  onClick={() => navigate("/dashboard/pembayaran-warga")}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Bayar Sekarang
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="py-5 px-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800 font-poppins">Iuran Lunas</p>
                <p className="text-xs text-emerald-600">
                  Tidak ada tagihan iuran untuk saat ini. Terima kasih!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === SALDO KAS === */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Saldo RT */}
        <Card className="group hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Saldo Kas RT</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-40" />
            ) : balance?.rt ? (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-poppins">
                  {formatRupiah(balance.rt.balance)}
                </div>
                <p className="text-xs text-slate-500 mt-1">{balance.rt.groupName}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Data tidak tersedia</p>
            )}
          </CardContent>
        </Card>

        {/* Saldo RW */}
        <Card className="group hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Saldo Kas RW</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-40" />
            ) : balance?.rw ? (
              <>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-poppins">
                  {formatRupiah(balance.rw.balance)}
                </div>
                <p className="text-xs text-slate-500 mt-1">{balance.rw.groupName}</p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Data tidak tersedia</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* === QUICK ACTIONS === */}
      <div className="grid gap-3 grid-cols-2">
        <Link to="/dashboard/pembayaran-warga" className="block">
          <Card className="h-full hover:shadow-md transition-all cursor-pointer group border-transparent hover:border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-5 text-center">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-700">Pembayaran</p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/organisasi-warga" className="block">
          <Card className="h-full hover:shadow-md transition-all cursor-pointer group border-transparent hover:border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-5 text-center">
              <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center mb-2 group-hover:bg-violet-100 transition-colors">
                <PartyPopper className="h-5 w-5 text-violet-600" />
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-700">Organisasi</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* === KEGIATAN YANG DISETUJUI === */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg sm:text-xl font-semibold font-poppins text-slate-900">
            Kegiatan Mendatang
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2 mt-1" /></CardHeader>
                <CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3 mt-2" /></CardContent>
              </Card>
            ))}
          </div>
        ) : approvedEvents.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 font-medium">Belum ada kegiatan mendatang.</p>
              <p className="text-xs text-slate-400 mt-1">Kegiatan yang disetujui akan tampil di sini.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {approvedEvents.slice(0, 6).map((event) => (
              <Link key={event.id} to={`/dashboard/events-warga/${event.id}`} className="block">
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </CardTitle>
                      <Badge variant="default" className="shrink-0 text-[10px] sm:text-xs">
                        {getEventStatusLabel(event.status)}
                      </Badge>
                    </div>
                    {event.startDate && (
                      <CardDescription className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <CalendarDays className="h-3 w-3" />
                        {formatDate(event.startDate)}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                      {event.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}