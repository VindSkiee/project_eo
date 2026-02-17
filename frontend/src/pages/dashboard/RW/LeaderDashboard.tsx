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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Building2,
  Wallet,
  CalendarDays,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Banknote,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import {
  dashboardService,
  type WalletDetail,
  type EventItem,
  type GroupItem,
  type UserItem,
  type FundRequest,
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
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Hari ini";
  if (diffDays === 1) return "Kemarin";
  if (diffDays < 7) return `${diffDays} hari lalu`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} minggu lalu`;
  return `${Math.floor(diffDays / 30)} bulan lalu`;
}

export default function LeaderDashboard() {
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [walletRes, eventsRes, groupsRes, usersRes, fundRequestsRes] =
          await Promise.allSettled([
            dashboardService.getWalletDetails(),
            dashboardService.getEvents(),
            dashboardService.getGroups(),
            dashboardService.getUsers(),
            dashboardService.getFundRequests(),
          ]);

        if (walletRes.status === "fulfilled") setWallet(walletRes.value);
        if (eventsRes.status === "fulfilled") setEvents(eventsRes.value);
        if (groupsRes.status === "fulfilled") setGroups(groupsRes.value);
        if (usersRes.status === "fulfilled") setUsers(usersRes.value);
        if (fundRequestsRes.status === "fulfilled") setFundRequests(fundRequestsRes.value);

        const failures = [walletRes, eventsRes, groupsRes, usersRes, fundRequestsRes].filter(
          (r) => r.status === "rejected"
        );
        if (failures.length > 0 && failures.length < 5) {
          toast.error("Sebagian data gagal dimuat.");
        } else if (failures.length === 5) {
          toast.error("Gagal memuat data dashboard.");
        }
      } catch {
        toast.error("Terjadi kesalahan saat memuat dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Derived data
  const pendingEvents = events.filter((e) => e.status === "PENDING_APPROVAL");
  const activeEvents = events.filter((e) => e.status === "APPROVED" || e.status === "IN_PROGRESS");
  const pendingFundRequests = fundRequests.filter((f) => f.status === "PENDING");
  const rtGroups = groups.filter((g) => g.type === "RT");
  const totalActionRequired = pendingEvents.length + pendingFundRequests.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
          Dashboard <span className="text-brand-green">{wallet?.communityGroup?.name || "—"}</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Ringkasan data dan statistik seluruh warga.
        </p>
      </div>

      {/* === STATS CARDS === */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Total Warga */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Total Warga
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {users.length}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Terdaftar dalam sistem
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total RT */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Total RT
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {rtGroups.length}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  RT aktif
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Kas RW (Saldo) */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Kas RW
            </CardTitle>
            <Wallet className="h-4 w-4 text-brand-green" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-28" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {wallet ? formatRupiah(wallet.balance) : "Rp 0"}
                </div>
                <p className="text-[11px] sm:text-xs text-brand-green mt-1 font-medium">
                  {wallet?.communityGroup?.name || "Saldo kas"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Kegiatan Aktif */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Kegiatan Aktif
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {activeEvents.length}
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Sedang berjalan
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* === ACTION REQUIRED === */}
      {!loading && totalActionRequired > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base font-semibold text-amber-900 font-poppins">
                Perlu Tindakan ({totalActionRequired})
              </CardTitle>
            </div>
            <CardDescription className="text-amber-700/80">
              Ada pengajuan yang menunggu persetujuan Anda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingEvents.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {pendingEvents.length} Kegiatan Menunggu Persetujuan
                    </p>
                    <p className="text-xs text-slate-500">
                      Kegiatan baru dari RT perlu di-review
                    </p>
                  </div>
                </div>
                <Link to="/dashboard/kegiatan">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                    Lihat <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}

            {pendingFundRequests.length > 0 && (
              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-brand-green/10 flex items-center justify-center">
                    <Banknote className="h-4 w-4 text-brand-green" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {pendingFundRequests.length} Pengajuan Dana Menunggu
                    </p>
                    <p className="text-xs text-slate-500">
                      Permintaan dana dari RT perlu di-review
                    </p>
                  </div>
                </div>
                <Link to="/dashboard/kas">
                  <Button variant="ghost" size="sm" className="text-brand-green hover:text-brand-green">
                    Lihat <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!loading && totalActionRequired === 0 && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="flex items-center gap-3 py-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">
              Semua aman! Tidak ada pengajuan yang menunggu persetujuan.
            </p>
          </CardContent>
        </Card>
      )}

      {/* === BOTTOM GRID: Recent Events + Fund Requests === */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 font-poppins">
                Kegiatan Terbaru
              </CardTitle>
              <CardDescription className="text-xs">5 kegiatan terakhir</CardDescription>
            </div>
            <Link to="/dashboard/kegiatan">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary text-xs">
                Semua <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CalendarDays className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Belum ada kegiatan.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {event.createdBy?.fullName || "—"} · {timeAgo(event.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        event.status === "APPROVED" || event.status === "IN_PROGRESS"
                          ? "default"
                          : event.status === "PENDING_APPROVAL"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-[10px] shrink-0"
                    >
                      {event.status === "PENDING_APPROVAL"
                        ? "Menunggu"
                        : event.status === "APPROVED"
                        ? "Disetujui"
                        : event.status === "IN_PROGRESS"
                        ? "Berjalan"
                        : event.status === "COMPLETED"
                        ? "Selesai"
                        : event.status === "CANCELLED"
                        ? "Dibatalkan"
                        : event.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Fund Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900 font-poppins">
                Pengajuan Dana Terbaru
              </CardTitle>
              <CardDescription className="text-xs">5 pengajuan terakhir</CardDescription>
            </div>
            <Link to="/dashboard/kas">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary text-xs">
                Semua <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-lg" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-1" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : fundRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Banknote className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Belum ada pengajuan dana.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fundRequests.slice(0, 5).map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0">
                      <Banknote className="h-4 w-4 text-brand-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {formatRupiah(req.amount)}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {req.description} · {req.communityGroup?.name || "—"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        req.status === "APPROVED"
                          ? "default"
                          : req.status === "PENDING"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-[10px] shrink-0"
                    >
                      {req.status === "PENDING"
                        ? "Menunggu"
                        : req.status === "APPROVED"
                        ? "Disetujui"
                        : "Ditolak"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* === QUICK LINKS === */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Link to="/dashboard/organisasi">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Organisasi</p>
                <p className="text-[11px] text-slate-500">Kelola RT & Warga</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/kegiatan">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Kegiatan</p>
                <p className="text-[11px] text-slate-500">Event & Acara</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/kas">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="h-10 w-10 rounded-xl bg-brand-green/10 flex items-center justify-center group-hover:bg-brand-green/20 transition-colors">
                <Wallet className="h-5 w-5 text-brand-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Keuangan</p>
                <p className="text-[11px] text-slate-500">Kas & Transaksi</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/pembayaran">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="flex items-center gap-3 py-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Pembayaran</p>
                <p className="text-[11px] text-slate-500">Riwayat Bayar</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}