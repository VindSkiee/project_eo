import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Separator } from "@/shared/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  ArrowLeft,
  XCircle,
  FileText,
  Send,
  CheckCircle2,
  XOctagon,
  Ban,
  CalendarClock,
  Receipt,
  FileCheck2,
  Pencil,
  Trash2,
  PartyPopper,
  Image as ImageIcon,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { eventService } from "@/features/event/services/eventService";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { getAvatarUrl } from "@/shared/helpers/avatarUrl";
import type { EventItem } from "@/shared/types";
import type { EventStatusType } from "@/features/event/types";
import {
  EventHeader,
  CommitteeList,
  ExpensesSummary,
  ApprovalWorkflow,
  StatusHistory,
  EditEventDialog,
  ApprovalDialog,
  CancelEventDialog,
  SettleEventDialog,
  ExtendDateDialog,
} from "@/features/event/components";
import { ExpenseReportDialog } from "@/features/event/components/ExpenseReportDialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
type UserRole = "LEADER" | "ADMIN" | "TREASURER" | "RESIDENT";

function getCurrentUser(): { id: string; role: UserRole } | null {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return { id: u.id, role: u.role };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState<"approve" | "reject" | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approvalSubmitting, setApprovalSubmitting] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showExpenseReportDialog, setShowExpenseReportDialog] = useState(false);
  const [showSettleDialog, setShowSettleDialog] = useState(false);
  const [previewResultImage, setPreviewResultImage] = useState<string | null>(null);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const user = useMemo(() => getCurrentUser(), []);
  const role = user?.role ?? "RESIDENT";
  const status = (event?.status ?? "DRAFT") as EventStatusType;
  const isCreator = user?.id === event?.createdById;

  useEffect(() => {
    if (!id) return;
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const eventData = await eventService.getById(id!);
      setEvent(eventData);
    } catch (error) {
      toast.error("Gagal memuat detail acara.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------------------------------
  // Action handlers
  // -----------------------------------------------------------------------
  const handleSubmitForApproval = async () => {
    try {
      await eventService.submit(id!);
      toast.success("Kegiatan berhasil diajukan untuk persetujuan!");
      fetchEvent();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal mengajukan kegiatan.");
    }
  };

  const handleApproval = async () => {
    if (!showApprovalDialog) return;
    setApprovalSubmitting(true);
    try {
      await eventService.processApproval(id!, {
        status: showApprovalDialog === "approve" ? "APPROVED" : "REJECTED",
        notes: approvalNotes || undefined,
      });
      toast.success(
        showApprovalDialog === "approve"
          ? "Kegiatan berhasil disetujui!"
          : "Kegiatan berhasil ditolak."
      );
      setShowApprovalDialog(null);
      setApprovalNotes("");
      fetchEvent();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal memproses persetujuan.");
    } finally {
      setApprovalSubmitting(false);
    }
  };

  const handleExpenseReport = async (
    items: { title: string; amount: number }[],
    remainingAmount: number,
    receiptFiles: File[],
  ) => {
    try {
      const result = await eventService.submitExpenseReport(id!, items, remainingAmount, receiptFiles);
      toast.success(result?.message || "Laporan pengeluaran berhasil disubmit!");
      setShowExpenseReportDialog(false);
      fetchEvent();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal mengirim laporan pengeluaran.");
    }
  };

  const handleCancel = async (reason: string) => {
    try {
      await eventService.cancel(id!, reason);
      toast.success("Kegiatan berhasil dibatalkan.");
      setShowCancelDialog(false);
      fetchEvent();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal membatalkan kegiatan.");
    }
  };

  const handleSettle = async (description: string, photoFiles: File[]) => {
    try {
      const result = await eventService.settle(id!, description, photoFiles);
      toast.success(result?.message || "Kegiatan berhasil diselesaikan & dilaporkan!");
      setShowSettleDialog(false);
      fetchEvent();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal menyelesaikan kegiatan.");
    }
  };

  const handleExtendDate = async (endDate: string) => {
    try {
      await eventService.extendDate(id!, endDate);
      toast.success("Tanggal kegiatan berhasil diperpanjang!");
      setShowExtendDialog(false);
      fetchEvent();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal memperpanjang tanggal.");
    }
  };

  const handleEdit = async (data: Parameters<typeof eventService.update>[1]) => {
    setEditSubmitting(true);
    try {
      await eventService.update(id!, data);
      toast.success("Kegiatan berhasil diperbarui!");
      setShowEditDialog(false);
      fetchEvent();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal memperbarui kegiatan.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await eventService.delete(id!);
      toast.success("Kegiatan berhasil dihapus.");
      navigate(-1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || "Gagal menghapus kegiatan.");
    }
  };

  // -----------------------------------------------------------------------
  // Permission matrix: which actions are available
  // -----------------------------------------------------------------------
  const canEdit = ["DRAFT", "REJECTED"].includes(status) && (isCreator || ["LEADER", "ADMIN"].includes(role));
  const canDelete = status === "DRAFT" && (isCreator || ["LEADER", "ADMIN"].includes(role));
  const canSubmit = ["DRAFT", "REJECTED"].includes(status) && (isCreator || ["LEADER", "ADMIN"].includes(role));
  // Only TREASURER can approve/reject SUBMITTED events
  const canApprove = status === "SUBMITTED" && role === "TREASURER";
  const canCancel =
    ["DRAFT", "SUBMITTED", "FUNDED", "ONGOING"].includes(status) &&
    (isCreator || ["LEADER", "ADMIN"].includes(role));
  const canExtendDate = status === "ONGOING" && (isCreator || ["LEADER", "ADMIN"].includes(role));
  // Treasurer submits expense report at FUNDED → ONGOING
  const canSubmitExpenseReport = status === "FUNDED" && role === "TREASURER";
  // Leader/Admin settles at COMPLETED → SETTLED
  const canSettle = status === "COMPLETED" && ["LEADER", "ADMIN"].includes(role);

  const hasAnyAction =
    canEdit || canDelete || canSubmit || canApprove || canCancel ||
    canExtendDate || canSubmitExpenseReport || canSettle;

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-8 w-40" />
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Data acara tidak ditemukan.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Daftar Acara
      </Button>

      {/* Event Header */}
      <EventHeader event={event} />

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Deskripsi Acara
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {event.description || "Tidak ada deskripsi."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CommitteeList event={event} />
        <ExpensesSummary
          event={event}
          canVerify={false}
          onVerify={async () => {}}
        />
      </div>

      {/* === Action Buttons === */}
      {hasAnyAction && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {/* DRAFT actions */}
              {canEdit && (
                <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
              )}
              {canDelete && (
                <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setShowDeleteDialog(true)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Hapus
                </Button>
              )}
              {canSubmit && (
                <Button size="sm" onClick={handleSubmitForApproval}>
                  <Send className="h-4 w-4 mr-1" /> Ajukan Persetujuan
                </Button>
              )}

              <Separator orientation="vertical" className="h-8 hidden sm:block" />

              {/* Approval actions (Treasurer only) */}
              {canApprove && (
                <>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowApprovalDialog("approve")}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Setujui & Cairkan Dana
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowApprovalDialog("reject")}>
                    <XOctagon className="h-4 w-4 mr-1" /> Tolak
                  </Button>
                </>
              )}

              {/* Expense Report (Treasurer, FUNDED) */}
              {canSubmitExpenseReport && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowExpenseReportDialog(true)}>
                  <Receipt className="h-4 w-4 mr-1" /> Input Laporan Pengeluaran
                </Button>
              )}

              {/* Extend Date (Leader/Admin, ONGOING) */}
              {canExtendDate && (
                <Button size="sm" variant="outline" onClick={() => setShowExtendDialog(true)}>
                  <CalendarClock className="h-4 w-4 mr-1" /> Perpanjang Tanggal
                </Button>
              )}

              {/* Settlement (Leader/Admin, COMPLETED) */}
              {canSettle && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setShowSettleDialog(true)}>
                  <FileCheck2 className="h-4 w-4 mr-1" /> Selesaikan & Lapor
                </Button>
              )}

              {/* Cancel (always last, destructive) */}
              {canCancel && (
                <Button size="sm" variant="outline" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-auto" onClick={() => setShowCancelDialog(true)}>
                  <Ban className="h-4 w-4 mr-1" /> Batalkan Acara
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* === LAPORAN AKHIR KEGIATAN (SETTLED) === */}
      {status === "SETTLED" && (() => {
        const resultPhotos = (event.resultImages ?? []).map((p) => getAvatarUrl(p)).filter(Boolean) as string[];
        const budgetEstimated = Number(event.budgetEstimated);
        const budgetActual = event.budgetActual !== null && event.budgetActual !== undefined ? Number(event.budgetActual) : null;
        const formatRp = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
        const selisih = budgetActual !== null ? budgetEstimated - budgetActual : null;
        return (
          <Card className="relative overflow-hidden border-0 ring-1 ring-emerald-200 bg-white shadow-sm rounded-2xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <CardHeader className="pb-3 pt-5">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-800">
                <div className="p-1.5 rounded-md bg-emerald-100">
                  <PartyPopper className="h-4 w-4 text-emerald-600" />
                </div>
                Laporan Akhir Kegiatan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pb-6">

              {/* Budget Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-xs text-slate-500 font-medium mb-1">Anggaran Diajukan</p>
                  <p className="text-base font-bold text-slate-900">{formatRp(budgetEstimated)}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <p className="text-xs text-emerald-600 font-medium mb-1">Total Pengeluaran</p>
                  <p className="text-base font-bold text-emerald-700">{budgetActual !== null ? formatRp(budgetActual) : "-"}</p>
                </div>
                <div className={`rounded-xl p-3 border ${selisih !== null && selisih >= 0 ? "bg-blue-50 border-blue-100" : "bg-rose-50 border-rose-100"}`}>
                  <p className={`text-xs font-medium mb-1 ${selisih !== null && selisih >= 0 ? "text-blue-600" : "text-rose-600"}`}>Sisa Dana Dikembalikan</p>
                  <p className={`text-base font-bold ${selisih !== null && selisih >= 0 ? "text-blue-700" : "text-rose-700"}`}>{selisih !== null ? formatRp(selisih) : "-"}</p>
                </div>
              </div>

              {/* Result Description */}
              {event.resultDescription && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Deskripsi Hasil Kegiatan
                  </p>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{event.resultDescription}</p>
                  </div>
                </div>
              )}

              {/* Result Photos */}
              {resultPhotos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5" /> Foto Dokumentasi ({resultPhotos.length})
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {resultPhotos.map((url, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer group shadow-sm"
                        onClick={() => setPreviewResultImage(url)}
                      >
                        <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 className="h-5 w-5 text-white drop-shadow" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No photos placeholder */}
              {resultPhotos.length === 0 && (
                <div className="flex items-center gap-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4">
                  <ImageIcon className="h-5 w-5 text-slate-300 shrink-0" />
                  <p className="text-sm text-slate-400">Tidak ada foto dokumentasi.</p>
                </div>
              )}

            </CardContent>
          </Card>
        );
      })()}

      {/* === Preview Dialog Result Photo === */}
      <Dialog open={!!previewResultImage} onOpenChange={(o) => !o && setPreviewResultImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-poppins">Foto Dokumentasi Kegiatan</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-2 bg-slate-100/50 rounded-xl overflow-hidden min-h-[40vh] max-h-[70vh]">
            {previewResultImage && (
              <img src={previewResultImage} alt="Dokumentasi" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
            )}
          </div>
        </DialogContent>
      </Dialog>
      <ApprovalWorkflow event={event} />
      <StatusHistory event={event} />

      {/* ====================== Dialogs ====================== */}

      {/* Edit Dialog */}
      {showEditDialog && event && (
        <EditEventDialog
          event={event}
          onClose={() => setShowEditDialog(false)}
          onSubmit={handleEdit}
          submitting={editSubmitting}
        />
      )}

      {/* Approval Dialog */}
      {showApprovalDialog && event && (
        <ApprovalDialog
          event={event}
          action={showApprovalDialog}
          onClose={() => {
            setShowApprovalDialog(null);
            setApprovalNotes("");
          }}
          onSubmit={handleApproval}
          notes={approvalNotes}
          onNotesChange={setApprovalNotes}
          submitting={approvalSubmitting}
        />
      )}

      {/* Cancel Dialog */}
      <CancelEventDialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={handleCancel}
        eventTitle={event.title}
        eventStatus={status}
      />

      {/* Expense Report Dialog (Treasurer, FUNDED) */}
      <ExpenseReportDialog
        open={showExpenseReportDialog}
        onClose={() => setShowExpenseReportDialog(false)}
        budgetEstimated={Number(event.budgetEstimated)}
        onSubmit={handleExpenseReport}
      />

      {/* Settle Dialog (Leader/Admin, COMPLETED) */}
      <SettleEventDialog
        open={showSettleDialog}
        onClose={() => setShowSettleDialog(false)}
        onSubmit={handleSettle}
      />

      {/* Extend Date Dialog */}
      <ExtendDateDialog
        open={showExtendDialog}
        onClose={() => setShowExtendDialog(false)}
        onSubmit={handleExtendDate}
        currentEndDate={event.endDate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Hapus Kegiatan"
        description={`Yakin ingin menghapus kegiatan "${event?.title}"? Aksi ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus"
        onConfirm={handleDelete}
      />
    </div>
  );
}
