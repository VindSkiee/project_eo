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
import { Textarea } from "@/shared/ui/textarea";
import { Label } from "@/shared/ui/label";
import { AlertTriangle, Ban } from "lucide-react";
import type { EventStatusType } from "@/features/event/types";

interface CancelEventDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  eventTitle: string;
  eventStatus: EventStatusType;
}

export function CancelEventDialog({
  open,
  onClose,
  onConfirm,
  eventTitle,
  eventStatus,
}: CancelEventDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hasFunds = ["FUNDED", "ONGOING"].includes(eventStatus);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-700">
            <Ban className="h-5 w-5" />
            Batalkan Kegiatan
          </DialogTitle>
          <DialogDescription>
            Anda akan membatalkan kegiatan <strong>"{eventTitle}"</strong>.
          </DialogDescription>
        </DialogHeader>

        {hasFunds && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Dana akan dikembalikan</p>
              <p className="text-xs mt-1">
                Kegiatan ini sudah didanai. Pembatalan akan mengembalikan dana ke kas kelompok.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="cancel-reason">Alasan pembatalan *</Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan alasan pembatalan kegiatan ini..."
            rows={3}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || submitting}
          >
            {submitting ? "Memproses..." : "Ya, Batalkan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
