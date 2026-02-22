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
  Trophy,
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

  // Full-year paid: no unpaid bill AND next bill is in the following year
  const currentYear = new Date().getFullYear();
  const paidFullYear = !hasUnpaidBill && bill !== null && bill.nextBillYear > currentYear;

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
      {/* === WARNING: Pembayaran Menunggu (Pending) === */}
      {!loading && pendingPayments.length > 0 && (
        <Card className="relative overflow-hidden border-0 ring-1 ring-amber-200/50 bg-white shadow-[0_2px_10px_-3px_rgba(251,191,36,0.2)] rounded-2xl animate-in slide-in-from-top duration-500">
          {/* Aksent Top Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>

          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 ring-1 ring-amber-100">
                <AlertTriangle className="h-6 w-6" strokeWidth={2.5} />
              </div>

              <div className="flex-1 space-y-1">
                <h3 className="text-base font-semibold text-slate-900 font-poppins tracking-tight">
                  Menunggu Pembayaran
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-lg">
                  Anda memiliki <span className="font-medium text-amber-600">{pendingPayments.length} transaksi</span> yang belum diselesaikan. Segera selesaikan agar iuran tercatat.
                </p>

                {/* List Transaksi Pending */}
                <div className="mt-3 space-y-2 max-w-sm border-l-2 border-amber-200 pl-3">
                  {pendingPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-mono text-xs">{p.orderId.length > 20 ? p.orderId.substring(0, 20) + "..." : p.orderId}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{formatRupiah(Number(p.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                className="w-full sm:w-auto mt-4 sm:mt-0 bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-200 rounded-xl"
                onClick={() => navigate("/dashboard/pembayaran-warga")}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Bayar Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* === MAIN CARDS: Status Tagihan === */}
      {loading ? (
        <Skeleton className="h-32 w-full rounded-2xl" />
      ) : hasUnpaidBill ? (

        /* CARD 1: ADA TAGIHAN (DANGER/WARNING) */
        <Card className="relative overflow-hidden border-0 ring-1 ring-red-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500"></div>

          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

              <div className="flex items-start gap-4 flex-1">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <AlertCircle className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900 font-poppins tracking-tight">
                    Tagihan Iuran Bulanan
                  </h3>
                  <p className="text-sm text-slate-500">
                    {bill?.dueDateDescription || "Segera lunasi iuran bulan ini"}
                  </p>

                  {/* Total & Breakdown */}
                  <div className="pt-2">
                    <p className="text-3xl sm:text-4xl font-bold text-slate-900 font-poppins tracking-tight">
                      {formatRupiah(bill?.totalAmount || 0)}
                    </p>
                    {bill?.breakdown && bill.breakdown.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {bill.breakdown.map((item, idx) => (
                          <div key={idx} className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200/50">
                            <span className="text-slate-400">Iuran {item.type}</span>
                            <span className="text-slate-900">{formatRupiah(item.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto shrink-0 border-t border-slate-100 md:border-t-0 pt-5 md:pt-0">
                <Button
                  size="lg"
                  className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 px-8"
                  onClick={() => navigate("/dashboard/pembayaran-warga")}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Bayar Sekarang
                  <ArrowRight className="h-4 w-4 ml-2 opacity-70" />
                </Button>
              </div>

            </div>
          </CardContent>
        </Card>

      ) : paidFullYear ? (

        /* CARD 2: LUNAS SETAHUN (SUCCESS/CELEBRATION) */
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md rounded-2xl">
          {/* Decorative Pattern / Glow */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-black/5 blur-xl"></div>

          <CardContent className="relative p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30 shadow-inner">
                <Trophy className="h-8 w-8 text-white" strokeWidth={2} />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold font-poppins tracking-tight">
                    Iuran Lunas Setahun Penuh! 🎉
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm ring-1 ring-inset ring-white/20">
                    Tahun {currentYear}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-white/90 leading-relaxed max-w-2xl">
                  Selamat! Seluruh kewajiban iuran Anda di tahun <strong>{currentYear}</strong> telah selesai. Terima kasih atas dedikasi Anda untuk memajukan lingkungan.
                </p>

                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-black/10 backdrop-blur-sm text-xs font-medium text-white/90">
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>Pantau terus MarinaKas untuk event lingkungan terbaru.</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      ) : (

        /* CARD 3: LUNAS BULAN INI (SUCCESS/CLEAN) */
        <Card className="relative overflow-hidden border-0 ring-1 ring-emerald-100 bg-white shadow-sm rounded-2xl">
          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500"></div>
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 font-poppins tracking-tight">
                  Status Iuran Terkini
                </h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Anda tidak memiliki tagihan tertunggak saat ini. Terima kasih!
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