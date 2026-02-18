import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Badge } from "@/shared/ui/badge";
import {
  Users,
  CalendarDays,
  Wallet,
  Banknote,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import { eventService } from "@/features/event/services/eventService";
import { userService } from "@/shared/services/userService";
import { fundRequestService } from "@/features/finance/services/fundRequestService";
import type {
  WalletDetail,
  EventItem,
  UserItem,
  FundRequest,
} from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminDashboard() {
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [walletRes, eventsRes, usersRes, frRes] =
          await Promise.allSettled([
            financeService.getWalletDetails(),
            eventService.getAll(),
            userService.getAll(),
            fundRequestService.getAll(),
          ]);

        if (walletRes.status === "fulfilled") setWallet(walletRes.value);
        if (eventsRes.status === "fulfilled") setEvents(eventsRes.value);
        if (usersRes.status === "fulfilled") setUsers(usersRes.value);
        if (frRes.status === "fulfilled") setFundRequests(frRes.value);

        const failures = [walletRes, eventsRes, usersRes, frRes].filter(
          (r) => r.status === "rejected"
        );
        if (failures.length > 0 && failures.length < 4) {
          toast.error("Sebagian data gagal dimuat.");
        } else if (failures.length === 4) {
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

  const activeEvents = events.filter(
    (e) => e.status === "APPROVED" || e.status === "IN_PROGRESS"
  );
  const pendingFR = fundRequests.filter((f) => f.status === "PENDING");
  const recentEvents = events.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
          Dashboard{" "}
          <span className="text-brand-green">
            {wallet?.communityGroup?.name || "RT"}
          </span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Kelola warga, kegiatan, dan keuangan RT Anda.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Warga
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {users.length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Saldo Kas
            </CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {wallet ? formatRupiah(wallet.balance) : "Rp 0"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Kegiatan Aktif
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-brand-green" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {activeEvents.length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Pengajuan Dana
            </CardTitle>
            <Banknote className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">
                {pendingFR.length}
              </div>
            )}
            {!loading && pendingFR.length > 0 && (
              <p className="text-xs text-amber-600 mt-1">Menunggu persetujuan</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-poppins">
            Kegiatan Terbaru
          </CardTitle>
          <Link to="/dashboard/kegiatan-rt">
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              Lihat Semua <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              Belum ada kegiatan.
            </p>
          ) : (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {event.startDate ? new Date(event.startDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      }) : "Tanggal tidak tersedia"}
                    </p>
                  </div>
                  <Badge
                    variant={
                      event.status === "APPROVED"
                        ? "default"
                        : event.status === "REJECTED" ||
                            event.status === "CANCELLED"
                          ? "destructive"
                          : "secondary"
                    }
                    className="text-xs shrink-0 ml-2"
                  >
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/dashboard/organisasi-rt">
          <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-slate-700">
                Data Warga
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/kegiatan-rt">
          <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <CalendarDays className="h-5 w-5 text-brand-green" />
              <span className="text-sm font-medium text-slate-700">
                Kegiatan
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/kas-rt">
          <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-slate-700">
                Kas & Keuangan
              </span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/pengaturan-iuran">
          <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <Banknote className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-slate-700">
                Pengaturan Iuran
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}