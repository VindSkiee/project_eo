import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  CalendarDays,
  ArrowRight,
  CreditCard,
  AlertTriangle,
  Receipt,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import { fundRequestService } from "@/features/finance/services/fundRequestService";
import { eventService } from "@/features/event/services/eventService";
import {
  RecentTransactions,
  RecentEventsCard,
} from "@/features/dashboard/components";
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

  // Current user
  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return JSON.parse(raw).id as string;
    } catch {
      return null;
    }
  })();

  const currentUserGroupId = (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return null;
      return JSON.parse(raw).communityGroupId as number | undefined;
    } catch {
      return null;
    }
  })();

  // Derived data — scoped to current user's group wallet
  const ownTx = wallet
    ? transactions.filter((t) => t.walletId === wallet.id)
    : transactions;
  const creditTx = ownTx.filter((t) => t.type === "CREDIT" || t.type === "INCOME");
  const debitTx = ownTx.filter((t) => t.type === "DEBIT" || t.type === "EXPENSE");
  const totalCredit = creditTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalDebit = debitTx.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const pendingFR = fundRequests.filter((f) => f.status === "PENDING");
  const activeEvents = events.filter(
    (e) => e.status === "APPROVED" || e.status === "FUNDED" || e.status === "ONGOING"
  );
  // Only show events where current user is the assigned approver
  const eventsNeedingReview = events.filter(
    (e) =>
      e.status === "SUBMITTED" &&
      e.approvals?.some(
        (a) => a.approverId === currentUserId && a.status === "PENDING"
      )
  );
  const eventsFunded = events.filter((e) => e.status === "FUNDED");
  // UNDER_REVIEW events where fund request targets current user's group (RW Treasurer)
  const eventsUnderReview = events.filter(
    (e) =>
      e.status === "UNDER_REVIEW" &&
      e.fundRequests?.some(
        (fr) => fr.status === "PENDING" && fr.targetGroupId === currentUserGroupId
      )
  );

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
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-10 h-24 w-24 rounded-full bg-white/5" />
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-white/80 font-poppins flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Saldo Kas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-10 w-40 bg-white/20" />
          ) : (
            <>
              <div className="text-3xl sm:text-4xl font-bold tracking-tight">
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

      {/* Alert: Events Needing Review */}
      {!loading && eventsNeedingReview.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-800 text-sm">
                  {eventsNeedingReview.length} acara menunggu persetujuan Anda
                </h3>
                <p className="text-xs text-amber-700/80 mt-0.5">
                  Segera review dan setujui/tolak pengajuan acara berikut.
                </p>
                <div className="mt-2.5 space-y-1.5">
                  {eventsNeedingReview.map((ev) => (
                    <Link key={ev.id} to={`/dashboard/events/${ev.id}`}>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all cursor-pointer group">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-slate-800 group-hover:text-amber-700 transition-colors">{ev.title}</span>
                          <span className="text-xs text-slate-500 ml-2 hidden sm:inline">
                            {formatRupiah(Number(ev.budgetEstimated))}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-amber-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert: Events Needing Expense Report */}
      {!loading && eventsFunded.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/60">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <Receipt className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-blue-800 text-sm">
                  {eventsFunded.length} acara perlu input laporan pengeluaran
                </h3>
                <p className="text-xs text-blue-700/80 mt-0.5">
                  Dana sudah dicairkan. Input daftar belanja dan bukti nota untuk memulai acara.
                </p>
                <div className="mt-2.5 space-y-1.5">
                  {eventsFunded.map((ev) => (
                    <Link key={ev.id} to={`/dashboard/events/${ev.id}`}>
                      <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group">
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-slate-800 group-hover:text-blue-700 transition-colors">{ev.title}</span>
                          <span className="text-xs text-slate-500 ml-2 hidden sm:inline">
                            {formatRupiah(Number(ev.budgetEstimated))}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert: Events Needing Fund Review (UNDER_REVIEW) */}
      {!loading && eventsUnderReview.length > 0 && (
        <Card className="border-indigo-200 bg-indigo-50/60">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                <Banknote className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-indigo-800 text-sm">
                  {eventsUnderReview.length} pengajuan dana tambahan menunggu review
                </h3>
                <p className="text-xs text-indigo-700/80 mt-0.5">
                  RT mengajukan dana tambahan untuk acara. Segera tinjau dan proses.
                </p>
                <div className="mt-2.5 space-y-1.5">
                  {eventsUnderReview.map((ev) => {
                    const pending = ev.fundRequests?.find((fr) => fr.status === "PENDING");
                    return (
                      <Link key={ev.id} to={`/dashboard/events/${ev.id}`}>
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-indigo-200 hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer group">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-slate-800 group-hover:text-indigo-700 transition-colors">{ev.title}</span>
                            {pending && (
                              <span className="text-xs text-indigo-600 ml-2">
                                {formatRupiah(Number(pending.amount))}
                              </span>
                            )}
                          </div>
                          <ArrowRight className="h-4 w-4 text-indigo-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Pemasukan",
            icon: <ArrowDownLeft className="h-4 w-4" />,
            iconBg: "bg-emerald-100 text-emerald-600",
            value: formatRupiah(totalCredit),
            valueColor: "text-emerald-600",
            sub: `${creditTx.length} transaksi`,
          },
          {
            title: "Pengeluaran",
            icon: <ArrowUpRight className="h-4 w-4" />,
            iconBg: "bg-red-100 text-red-600",
            value: formatRupiah(totalDebit),
            valueColor: "text-red-600",
            sub: `${debitTx.length} transaksi`,
          },
          {
            title: "Kegiatan Aktif",
            icon: <CalendarDays className="h-4 w-4" />,
            iconBg: "bg-primary/10 text-primary",
            value: String(activeEvents.length),
            valueColor: "text-slate-900",
          },
          {
            title: "Pengajuan Dana",
            icon: <FileText className="h-4 w-4" />,
            iconBg: "bg-amber-100 text-amber-600",
            value: String(pendingFR.length),
            valueColor: "text-amber-600",
            sub: pendingFR.length > 0 ? "Butuh review Anda" : undefined,
            subColor: "text-amber-600 font-medium",
          },
        ].map((card) => (
          <Card key={card.title} className="hover:shadow-sm transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
                {card.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                {card.icon}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className={`text-xl sm:text-2xl font-bold ${card.valueColor}`}>
                    {card.value}
                  </div>
                  {card.sub && (
                    <p className={`text-xs mt-1 ${card.subColor ?? "text-slate-500"}`}>
                      {card.sub}
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two columns: Recent Transactions + Recent Events */}
      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <RecentTransactions
          transactions={transactions}
          walletId={wallet?.id ?? null}
          loading={loading}
          viewAllLink="/dashboard/kas-bendahara"
        />
        <RecentEventsCard
          events={events}
          loading={loading}
          viewAllLink="/dashboard/kegiatan-bendahara"
        />
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            to: "/dashboard/kas-bendahara",
            icon: <Wallet className="h-5 w-5" />,
            iconBg: "bg-primary/10 text-primary",
            label: "Kas & Keuangan",
          },
          {
            to: "/dashboard/kegiatan-bendahara",
            icon: <CalendarDays className="h-5 w-5" />,
            iconBg: "bg-emerald-100 text-emerald-600",
            label: "Kegiatan",
          },
          {
            to: "/dashboard/pembayaran-bendahara",
            icon: <CreditCard className="h-5 w-5" />,
            iconBg: "bg-blue-100 text-blue-600",
            label: "Pembayaran",
          },
        ].map((link) => (
          <Link key={link.to} to={link.to}>
            <Card className="group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="flex items-center gap-3 py-4">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${link.iconBg}`}>
                  {link.icon}
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {link.label}
                </span>
                <ArrowRight className="h-4 w-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}