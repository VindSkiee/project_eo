import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  CreditCard,
  Users,
  Megaphone,
  ArrowRight,
  AlertCircle,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import {
  dashboardService,
  type TransparencyBalance,
  type MyBill,
  type EventItem,
  type GroupItem,
} from "@/services/dashboardService";

// === HELPERS ===

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return "Baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffWeeks < 5) return `${diffWeeks} minggu lalu`;
  return `${diffMonths} bulan lalu`;
}

function getEventStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "APPROVED":
    case "FUNDED":
    case "COMPLETED":
    case "SETTLED":
      return "default";
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "ONGOING":
      return "secondary";
    case "REJECTED":
    case "CANCELLED":
      return "destructive";
    default:
      return "outline";
  }
}

function getEventStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: "Draf",
    SUBMITTED: "Diajukan",
    UNDER_REVIEW: "Ditinjau",
    REJECTED: "Ditolak",
    APPROVED: "Disetujui",
    CANCELLED: "Dibatalkan",
    FUNDED: "Didanai",
    ONGOING: "Berlangsung",
    COMPLETED: "Selesai",
    SETTLED: "Tuntas",
  };
  return labels[status] || status;
}

// === COMPONENT ===

export default function ResidentDashboard() {
  const [balance, setBalance] = useState<TransparencyBalance | null>(null);
  const [bill, setBill] = useState<MyBill | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  const user = (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [balanceData, billData, eventsData, groupsData] =
          await Promise.allSettled([
            dashboardService.getTransparencyBalance(),
            dashboardService.getMyBill(),
            dashboardService.getEvents(),
            dashboardService.getGroups(),
          ]);

        if (balanceData.status === "fulfilled") setBalance(balanceData.value);
        else toast.error("Gagal memuat data saldo kas.");

        if (billData.status === "fulfilled") setBill(billData.value);
        else toast.error("Gagal memuat data tagihan.");

        if (eventsData.status === "fulfilled") setEvents(eventsData.value);
        else toast.error("Gagal memuat data pengumuman.");

        if (groupsData.status === "fulfilled") setGroups(groupsData.value);
        else toast.error("Gagal memuat data organisasi.");
      } catch {
        toast.error("Terjadi kesalahan saat memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const hasUnpaidBill = bill !== null && bill.totalAmount > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
          Halo, {user?.fullName || "Warga"}!
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Selamat datang di portal informasi warga.
        </p>
      </div>

      {/* === ROW 1: Saldo Kas RW & RT === */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Saldo RW */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
              Saldo Kas RW
            </CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-40" />
            ) : balance?.rw ? (
              <>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {formatRupiah(balance.rw.balance)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {balance.rw.groupName}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Data tidak tersedia</p>
            )}
          </CardContent>
        </Card>

        {/* Saldo RT */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
              Saldo Kas RT
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-40" />
            ) : balance?.rt ? (
              <>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {formatRupiah(balance.rt.balance)}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {balance.rt.groupName}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400">Data tidak tersedia</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* === ROW 2: Tagihan & Organisasi === */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Tagihan Warga */}
        <Card
          className={
            hasUnpaidBill ? "border-red-200 bg-red-50/30" : undefined
          }
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
              Tagihan Iuran Anda
            </CardTitle>
            <CreditCard
              className={`h-4 w-4 ${hasUnpaidBill ? "text-red-500" : "text-slate-400"}`}
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : bill ? (
              <>
                <div
                  className={`text-xl sm:text-2xl font-bold ${
                    hasUnpaidBill ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {formatRupiah(bill.totalAmount)}
                </div>
                {bill.breakdown.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {bill.breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs sm:text-sm"
                      >
                        <span className="text-slate-500">
                          Iuran {item.type} ({item.groupName})
                        </span>
                        <span
                          className={`font-medium ${
                            hasUnpaidBill
                              ? "text-red-600"
                              : "text-slate-700"
                          }`}
                        >
                          {formatRupiah(item.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-1">
                    Tidak ada tagihan saat ini.
                  </p>
                )}
                {hasUnpaidBill && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-red-500 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Belum dibayar &middot; {bill.dueDateDescription}</span>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">
                Tidak ada data tagihan.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Jumlah Organisasi */}
        <Link to="/dashboard/organisasi" className="block">
          <Card className="h-full transition-shadow hover:shadow-md cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
                Organisasi
              </CardTitle>
              <Users className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">
                    {groups.length}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary mt-1 group-hover:underline">
                    <span>Lihat semua organisasi</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* === ANNOUNCEMENT / EVENT SECTION === */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Megaphone className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg sm:text-xl font-semibold font-poppins text-slate-900">
            Pengumuman & Kegiatan
          </h2>
        </div>

        {loading ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <CalendarDays className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 font-medium">
                Belum ada pengumuman atau kegiatan saat ini.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Kegiatan dan pengumuman dari lingkungan Anda akan tampil di sini.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                to={`/dashboard/events/${event.id}`}
                className="block"
              >
                <Card className="h-full transition-all hover:shadow-md hover:border-primary/30 cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm sm:text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </CardTitle>
                      <Badge
                        variant={getEventStatusVariant(event.status)}
                        className="shrink-0 text-[10px] sm:text-xs"
                      >
                        {getEventStatusLabel(event.status)}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-400 mt-1">
                      {timeAgo(event.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-3">
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