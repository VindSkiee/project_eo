import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Banknote,
  Building2,
  User,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { fundRequestService } from "@/features/finance/services/fundRequestService";
import { getFundRequestStatusInfo, getEventStatusInfo } from "@/shared/helpers/statusConfig";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import type { FundRequest } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FundRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const userRole = (() => {
    try {
      const s = localStorage.getItem("user");
      if (s) return JSON.parse(s).role;
    } catch { /* ignore */ }
    return null;
  })();

  const userGroupId = (() => {
    try {
      const s = localStorage.getItem("user");
      if (s) return JSON.parse(s).communityGroupId;
    } catch { /* ignore */ }
    return null;
  })();

  const [fundRequest, setFundRequest] = useState<FundRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingApprove, setPendingApprove] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectDecision, setRejectDecision] = useState("CONTINUE_WITH_ORIGINAL");
  const [submitting, setSubmitting] = useState(false);

  // RW Treasurer can approve if they are the target group
  const isRwTreasurer =
    userRole === "TREASURER" &&
    fundRequest?.targetGroupId !== undefined &&
    userGroupId === fundRequest.targetGroupId;

  const canApprove = isRwTreasurer && fundRequest?.status === "PENDING";

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fundRequestService.getById(id);
      setFundRequest(data);
    } catch {
      toast.error("Gagal memuat detail pengajuan dana.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleApprove = async () => {
    if (!fundRequest) return;
    setPendingApprove(false);
    try {
      await fundRequestService.approve(fundRequest.id);
      toast.success("Pengajuan dana berhasil disetujui!");
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal menyetujui pengajuan dana.");
    }
  };

  const handleReject = async () => {
    if (!fundRequest) return;
    if (!rejectReason.trim()) {
      toast.error("Alasan penolakan wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await fundRequestService.reject(fundRequest.id, {
        reason: rejectReason,
        rwDecision: rejectDecision,
      });
      toast.success("Pengajuan dana berhasil ditolak.");
      setShowRejectDialog(false);
      setRejectReason("");
      loadData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal menolak pengajuan dana.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentStatus = fundRequest
    ? getFundRequestStatusInfo(fundRequest.status)
    : getFundRequestStatusInfo("PENDING");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-poppins text-slate-900">
            Detail Pengajuan Dana
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Informasi lengkap pengajuan dana tambahan
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !fundRequest ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Banknote className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Data tidak ditemukan.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Card */}
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/80 font-poppins">
                Jumlah Dana Diajukan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl sm:text-4xl font-bold">
                {formatRupiah(fundRequest.amount)}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={currentStatus.variant}
                  className={`text-xs ${currentStatus.className}`}
                >
                  {currentStatus.label}
                </Badge>
                <span className="text-sm text-white/70">
                  {formatDate(fundRequest.createdAt)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Info Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Description */}
            <Card className="sm:col-span-2">
              <CardContent className="py-4">
                <p className="text-xs text-slate-500 mb-1">Deskripsi</p>
                <p className="text-sm font-medium text-slate-900">
                  {fundRequest.description}
                </p>
                {fundRequest.notes && (
                  <p className="text-xs text-slate-500 mt-2">{fundRequest.notes}</p>
                )}
              </CardContent>
            </Card>

            {/* From */}
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-lg bg-blue-50 p-2.5 shrink-0">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Pengaju</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {fundRequest.requesterGroup?.name ?? fundRequest.communityGroup?.name ?? "—"}
                  </p>
                  {(fundRequest.createdBy?.fullName ?? fundRequest.requestedBy?.fullName) && (
                    <p className="text-xs text-slate-500 truncate">
                      oleh {fundRequest.createdBy?.fullName ?? fundRequest.requestedBy?.fullName}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* To */}
            <Card>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="rounded-lg bg-emerald-50 p-2.5 shrink-0">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-500">Ditujukan ke</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {fundRequest.targetGroup?.name ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Event (if linked) */}
            {fundRequest.event && (
              <Card className="sm:col-span-2">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className="rounded-lg bg-purple-50 p-2.5 shrink-0">
                    <CalendarDays className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">Kegiatan Terkait</p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {fundRequest.event.title}
                    </p>
                    {fundRequest.event.status && (() => {
                      const es = getEventStatusInfo(fundRequest.event!.status!);
                      return (
                        <Badge variant="outline" className={`text-[10px] ${es.className}`}>
                          {es.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Approved/Rejected by */}
            {fundRequest.approvedBy && (
              <Card className="sm:col-span-2">
                <CardContent className="flex items-center gap-3 py-4">
                  <div className={`rounded-lg p-2.5 shrink-0 ${fundRequest.status === "APPROVED" ? "bg-emerald-50" : "bg-red-50"}`}>
                    <User className={`h-4 w-4 ${fundRequest.status === "APPROVED" ? "text-emerald-600" : "text-red-600"}`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">
                      {fundRequest.status === "APPROVED" ? "Disetujui oleh" : "Diproses oleh"}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {fundRequest.approvedBy.fullName}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Status: Pending indicator */}
            {fundRequest.status === "PENDING" && !canApprove && (
              <Card className="sm:col-span-2 border-yellow-200 bg-yellow-50">
                <CardContent className="flex items-center gap-3 py-4">
                  <Clock className="h-4 w-4 text-yellow-600 shrink-0" />
                  <p className="text-sm text-yellow-700">
                    Pengajuan ini sedang menunggu persetujuan dari bendahara RW.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Approve / Reject Actions */}
          {canApprove && (
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setPendingApprove(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Setujui Pengajuan
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => { setShowRejectDialog(true); setRejectReason(""); }}
              >
                <XCircle className="h-4 w-4" />
                Tolak Pengajuan
              </Button>
            </div>
          )}
        </>
      )}

      {/* Confirm Approve */}
      <ConfirmDialog
        open={pendingApprove}
        onOpenChange={(v) => { if (!v) setPendingApprove(false); }}
        title="Setujui Pengajuan Dana"
        description={`Yakin menyetujui pengajuan dana sebesar ${fundRequest ? formatRupiah(fundRequest.amount) : "—"}? Dana akan ditransfer ke kas pengaju.`}
        confirmLabel="Ya, Setujui"
        onConfirm={handleApprove}
      />

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onOpenChange={(open) => { if (!open) setShowRejectDialog(false); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-poppins">Tolak Pengajuan Dana</DialogTitle>
            <DialogDescription>
              Anda akan menolak pengajuan dana sebesar{" "}
              {fundRequest ? formatRupiah(fundRequest.amount) : "—"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Alasan Penolakan *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Masukkan alasan penolakan..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
            {fundRequest?.event && (
              <div className="space-y-2">
                <Label>Keputusan terhadap Kegiatan</Label>
                <Select value={rejectDecision} onValueChange={setRejectDecision}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CONTINUE_WITH_ORIGINAL">
                      Tetap lanjutkan dengan anggaran awal
                    </SelectItem>
                    <SelectItem value="CANCEL_EVENT">
                      Batalkan kegiatan
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tolak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
