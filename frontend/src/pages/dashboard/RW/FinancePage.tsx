import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,

} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Banknote,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  dashboardService,
  type WalletDetail,
  type Transaction,
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FinancePage() {
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTx, setSearchTx] = useState("");
  const [searchFR, setSearchFR] = useState("");

  // Reject Dialog
  const [selectedFR, setSelectedFR] = useState<FundRequest | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDecision, setRejectDecision] = useState("CONTINUE_WITH_ORIGINAL");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [walletRes, txRes, frRes] = await Promise.allSettled([
        dashboardService.getWalletDetails(),
        dashboardService.getTransactions(),
        dashboardService.getFundRequests(),
      ]);

      if (walletRes.status === "fulfilled") setWallet(walletRes.value);
      if (txRes.status === "fulfilled") setTransactions(txRes.value);
      if (frRes.status === "fulfilled") setFundRequests(frRes.value);

      const failures = [walletRes, txRes, frRes].filter((r) => r.status === "rejected");
      if (failures.length > 0) toast.error("Sebagian data keuangan gagal dimuat.");
    } catch {
      toast.error("Gagal memuat data keuangan.");
    } finally {
      setLoading(false);
    }
  };

  const pendingFR = fundRequests.filter((f) => f.status === "PENDING");

  const filteredTx = transactions.filter(
    (t) => t.description.toLowerCase().includes(searchTx.toLowerCase())
  );

  const filteredFR = fundRequests.filter(
    (f) =>
      f.description.toLowerCase().includes(searchFR.toLowerCase()) ||
      (f.communityGroup?.name || "").toLowerCase().includes(searchFR.toLowerCase())
  );

  // === Handle Approve Fund Request ===
  const handleApproveFR = async (fr: FundRequest) => {
    if (!confirm(`Setujui pengajuan dana ${formatRupiah(fr.amount)}?`)) return;
    try {
      await dashboardService.approveFundRequest(fr.id);
      toast.success("Pengajuan dana berhasil disetujui!");
      fetchData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Gagal menyetujui pengajuan dana.");
    }
  };

  // === Handle Reject Fund Request ===
  const handleRejectFR = async () => {
    if (!selectedFR) return;
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await dashboardService.rejectFundRequest(selectedFR.id, {
        reason: rejectReason,
        rwDecision: rejectDecision,
      });
      toast.success("Pengajuan dana berhasil ditolak.");
      setSelectedFR(null);
      setRejectReason("");
      fetchData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Gagal menolak pengajuan dana.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
          Kas & Keuangan
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Kelola kas, transaksi, dan pengajuan dana.
        </p>
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
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Transaksi
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-slate-900">{transactions.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Pengajuan Dana
            </CardTitle>
            <Banknote className="h-4 w-4 text-brand-green" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-slate-900">{fundRequests.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Menunggu
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-amber-600">{pendingFR.length}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Transaksi / Pengajuan Dana */}
      <Tabs defaultValue="transaksi" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transaksi">Riwayat Transaksi</TabsTrigger>
          <TabsTrigger value="pengajuan">
            Pengajuan Dana {pendingFR.length > 0 && `(${pendingFR.length})`}
          </TabsTrigger>
        </TabsList>

        {/* === TAB: Transaksi === */}
        <TabsContent value="transaksi" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari transaksi..."
              value={searchTx}
              onChange={(e) => setSearchTx(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : filteredTx.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Wallet className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 font-medium">
                  {searchTx ? "Transaksi tidak ditemukan." : "Belum ada transaksi."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTx.map((tx, idx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium text-slate-500">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                                tx.type === "INCOME" || tx.type === "CREDIT"
                                  ? "bg-emerald-100"
                                  : "bg-red-100"
                              }`}
                            >
                              {tx.type === "INCOME" || tx.type === "CREDIT" ? (
                                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {tx.description}
                              </p>
                              <p className="text-xs text-slate-500">
                                {tx.createdBy?.fullName || "Sistem"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              tx.type === "INCOME" || tx.type === "CREDIT"
                                ? "default"
                                : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {tx.type === "INCOME" || tx.type === "CREDIT" ? "Masuk" : "Keluar"}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={`font-medium ${
                            tx.type === "INCOME" || tx.type === "CREDIT"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {tx.type === "INCOME" || tx.type === "CREDIT" ? "+" : "-"}
                          {formatRupiah(Math.abs(tx.amount))}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDateTime(tx.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* === TAB: Pengajuan Dana === */}
        <TabsContent value="pengajuan" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari pengajuan..."
              value={searchFR}
              onChange={(e) => setSearchFR(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <Card>
              <CardContent className="py-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : filteredFR.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Banknote className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 font-medium">
                  {searchFR ? "Pengajuan tidak ditemukan." : "Belum ada pengajuan dana."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Deskripsi</TableHead>
                      <TableHead>Dari</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Kegiatan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFR.map((fr, idx) => (
                      <TableRow key={fr.id}>
                        <TableCell className="font-medium text-slate-500">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">
                            {fr.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(fr.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {fr.communityGroup?.name || fr.requestedBy?.fullName || "—"}
                        </TableCell>
                        <TableCell className="font-medium text-slate-900">
                          {formatRupiah(fr.amount)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {fr.event?.title || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              fr.status === "APPROVED"
                                ? "default"
                                : fr.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {fr.status === "PENDING"
                              ? "Menunggu"
                              : fr.status === "APPROVED"
                              ? "Disetujui"
                              : "Ditolak"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {fr.status === "PENDING" && (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                title="Setujui"
                                onClick={() => handleApproveFR(fr)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                title="Tolak"
                                onClick={() => {
                                  setSelectedFR(fr);
                                  setRejectReason("");
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* === Reject Fund Request Dialog === */}
      <Dialog
        open={!!selectedFR}
        onOpenChange={(open) => {
          if (!open) setSelectedFR(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-poppins">Tolak Pengajuan Dana</DialogTitle>
            <DialogDescription>
              Anda akan menolak pengajuan dana sebesar{" "}
              {selectedFR ? formatRupiah(selectedFR.amount) : "—"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedFR && (
              <div className="rounded-lg bg-slate-50 p-3 space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  {selectedFR.description}
                </p>
                <p className="text-xs text-slate-500">
                  Dari: {selectedFR.communityGroup?.name || "—"}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Alasan Penolakan *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Jelaskan alasan penolakan..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Keputusan RW</Label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rwDecision"
                    value="CONTINUE_WITH_ORIGINAL"
                    checked={rejectDecision === "CONTINUE_WITH_ORIGINAL"}
                    onChange={(e) => setRejectDecision(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm">Lanjutkan Acara</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="rwDecision"
                    value="CANCEL_EVENT"
                    checked={rejectDecision === "CANCEL_EVENT"}
                    onChange={(e) => setRejectDecision(e.target.value)}
                    className="accent-primary"
                  />
                  <span className="text-sm">Batalkan Acara</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedFR(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectFR}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Tolak Pengajuan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
