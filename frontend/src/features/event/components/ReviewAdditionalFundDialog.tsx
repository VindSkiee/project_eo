import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Loader2, CheckCircle2, XOctagon, PencilLine } from "lucide-react";
import type { FundRequestItem } from "@/features/event/types";

function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num || 0);
}

interface ReviewAdditionalFundDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    approved: boolean;
    approvedAmount?: number;
    reason?: string;
  }) => Promise<void>;
  fundRequest: FundRequestItem | null;
}

export function ReviewAdditionalFundDialog({
  open,
  onClose,
  onSubmit,
  fundRequest,
}: ReviewAdditionalFundDialogProps) {
  const [mode, setMode] = useState<"exact" | "adjust" | "reject">("exact");
  const [adjustedAmount, setAdjustedAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const requestedAmount = fundRequest ? Number(fundRequest.amount) : 0;
  const numAdjusted = parseFloat(adjustedAmount) || 0;

  const isValid =
    mode === "exact" ||
    (mode === "adjust" && numAdjusted > 0 && reason.trim().length > 0) ||
    (mode === "reject" && reason.trim().length > 0);

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      if (mode === "exact") {
        await onSubmit({ approved: true });
      } else if (mode === "adjust") {
        await onSubmit({
          approved: true,
          approvedAmount: numAdjusted,
          reason: reason.trim(),
        });
      } else {
        await onSubmit({ approved: false, reason: reason.trim() });
      }
      resetForm();
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setMode("exact");
    setAdjustedAmount("");
    setReason("");
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-poppins">
            Review Pengajuan Dana Tambahan
          </DialogTitle>
          <DialogDescription>
            Tinjau dan proses pengajuan dana tambahan dari RT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Fund request info */}
          {fundRequest && (
            <div className="rounded-lg bg-slate-50 p-3 space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">Nominal Diajukan</p>
                <p className="text-base font-bold text-slate-900">
                  {formatRupiah(requestedAmount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Alasan Pengajuan</p>
                <p className="text-sm text-slate-700 mt-0.5">
                  {fundRequest.description}
                </p>
              </div>
              {fundRequest.createdBy && (
                <p className="text-xs text-slate-400">
                  Diajukan oleh: {fundRequest.createdBy.fullName}
                </p>
              )}
            </div>
          )}

          {/* Action mode selection */}
          <div className="space-y-2">
            <Label>Keputusan</Label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setMode("exact")}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  mode === "exact"
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <CheckCircle2
                  className={`h-5 w-5 shrink-0 ${
                    mode === "exact" ? "text-emerald-600" : "text-slate-400"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">Setujui Sesuai Nominal</p>
                  <p className="text-xs text-slate-500">
                    Cairkan {formatRupiah(requestedAmount)} sesuai pengajuan
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("adjust")}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  mode === "adjust"
                    ? "border-blue-500 bg-blue-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <PencilLine
                  className={`h-5 w-5 shrink-0 ${
                    mode === "adjust" ? "text-blue-600" : "text-slate-400"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">Sesuaikan Nominal</p>
                  <p className="text-xs text-slate-500">
                    Ubah nominal yang dicairkan beserta alasannya
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("reject")}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                  mode === "reject"
                    ? "border-rose-500 bg-rose-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <XOctagon
                  className={`h-5 w-5 shrink-0 ${
                    mode === "reject" ? "text-rose-600" : "text-slate-400"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium">Tolak Pengajuan</p>
                  <p className="text-xs text-slate-500">
                    Tolak dan kembalikan status acara ke FUNDED
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Adjusted amount input */}
          {mode === "adjust" && (
            <div className="space-y-2">
              <Label htmlFor="adjusted-amount">Nominal yang Disetujui *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                  Rp
                </span>
                <Input
                  id="adjusted-amount"
                  type="number"
                  min="1"
                  placeholder="Masukkan nominal..."
                  value={adjustedAmount}
                  onChange={(e) => setAdjustedAmount(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Reason input */}
          {(mode === "adjust" || mode === "reject") && (
            <div className="space-y-2">
              <Label htmlFor="review-reason">
                {mode === "adjust" ? "Alasan Penyesuaian *" : "Alasan Penolakan *"}
              </Label>
              <Textarea
                id="review-reason"
                placeholder={
                  mode === "adjust"
                    ? "Jelaskan alasan penyesuaian nominal..."
                    : "Jelaskan alasan penolakan..."
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || submitting}
            variant={mode === "reject" ? "destructive" : "default"}
            className={
              mode !== "reject"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : undefined
            }
          >
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            {mode === "exact" && "Setujui & Cairkan"}
            {mode === "adjust" && "Setujui dengan Penyesuaian"}
            {mode === "reject" && "Tolak Pengajuan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
