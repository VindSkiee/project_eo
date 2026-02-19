import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  CalendarDays,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import { fundRequestService } from "@/features/finance/services/fundRequestService";
import { eventService } from "@/features/event/services/eventService";
import type {
  WalletDetail,
  Transaction,
  FundRequest,
  EventItem,
} from "@/shared/types";

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

export default function FinanceDashboard() {
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [walletRes, txRes, frRes, eventsRes] = await Promise.allSettled([
          financeService.getWalletDetails(),
          financeService.getTransactions(),
          fundRequestService.getAll(),
          eventService.getAll(),
        ]);

        if (walletRes.status === "fulfilled") setWallet(walletRes.value);
        if (txRes.status === "fulfilled") setTransactions(txRes.value);
        if (frRes.status === "fulfilled") setFundRequests(frRes.value);
        if (eventsRes.status === "fulfilled") setEvents(eventsRes.value);

        const failures = [walletRes, txRes, frRes, eventsRes].filter(
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

  // Derived data
  const creditTx = transactions.filter((t) => t.type === "CREDIT" || t.type === "INCOME");
  const debitTx = transactions.filter((t) => t.type === "DEBIT" || t.type === "EXPENSE");
  const totalCredit = creditTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalDebit = debitTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const pendingFR = fundRequests.filter((f) => f.status === "PENDING");
  const activeEvents = events.filter(
    (e) => e.status === "APPROVED" || e.status === "FUNDED" || e.status === "ONGOING"
  );
  const recentTx = transactions.slice(0, 5);
  const recentEvents = events.slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
            Dashboard{" "}
            <span className="text-brand-green">
              {wallet?.communityGroup?.name || "Keuangan"}
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Ringkasan arus kas, iuran warga, dan pengeluaran.
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/dashboard/kas-bendahara">
            <Button className="bg-primary hover:bg-brand-green transition-colors font-poppins gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Kas & Keuangan</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Wallet Card */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/80 font-poppins">
            Saldo Kas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-40 bg-white/20" />
          ) : (
            <>
              <div className="text-3xl sm:text-4xl font-bold">
                {wallet ? formatRupiah(wallet.balance) : "Rp 0"}
              </div>
              <p className="text-sm text-white/70 mt-1">
                {wallet?.communityGroup?.name || "—"} · Diperbarui{" "}
                {wallet ? formatDate(wallet.updatedAt) : "—"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Pemasukan
            </CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-emerald-600">
                {formatRupiah(totalCredit)}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">{creditTx.length} transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Pengeluaran
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-red-600">
                {formatRupiah(totalDebit)}
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">{debitTx.length} transaksi</p>
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
            <FileText className="h-4 w-4 text-amber-500" />
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
              <p className="text-xs text-amber-600 mt-1 font-medium">Butuh review Anda</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two columns: Recent Transactions + Recent Events */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-poppins">Transaksi Terakhir</CardTitle>
            <Link to="/dashboard/kas-bendahara">
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
            ) : recentTx.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                Belum ada transaksi.
              </p>
            ) : (
              <div className="space-y-3">
                {recentTx.map((tx) => {
                  const isIncome = tx.type === "CREDIT" || tx.type === "INCOME";
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                            isIncome ? "bg-emerald-100" : "bg-red-100"
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {tx.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold shrink-0 ml-2 ${
                          isIncome ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {isIncome ? "+" : "-"}
                        {formatRupiah(Math.abs(tx.amount))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-poppins">Kegiatan Terbaru</CardTitle>
            <Link to="/dashboard/kegiatan-bendahara">
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
                        {event.startDate
                          ? formatDate(event.startDate)
                          : "Tanggal tidak tersedia"}
                      </p>
                    </div>
                    <Badge
                      variant={
                        event.status === "APPROVED" || event.status === "FUNDED"
                          ? "default"
                          : event.status === "REJECTED" || event.status === "CANCELLED"
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
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/dashboard/kas-bendahara">
          <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-slate-700">Kas & Keuangan</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/kegiatan-bendahara">
          <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <CalendarDays className="h-5 w-5 text-brand-green" />
              <span className="text-sm font-medium text-slate-700">Kegiatan</span>
            </CardContent>
          </Card>
        </Link>
        <Link to="/dashboard/pembayaran-bendahara">
          <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
            <CardContent className="flex items-center gap-3 py-4">
              <CreditCard className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-slate-700">Pembayaran</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}