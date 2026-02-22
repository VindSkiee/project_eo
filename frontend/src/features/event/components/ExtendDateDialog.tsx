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
import { CalendarClock } from "lucide-react";

interface ExtendDateDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (endDate: string) => Promise<void>;
  currentEndDate: string | null;
}

export function ExtendDateDialog({
  open,
  onClose,
  onSubmit,
  currentEndDate,
}: ExtendDateDialogProps) {
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const minDate = currentEndDate
    ? new Date(new Date(currentEndDate).getTime() + 86400000).toISOString().split("T")[0]
    : today;

  const handleSubmit = async () => {
    if (!endDate) return;
    setSubmitting(true);
    try {
      await onSubmit(new Date(endDate).toISOString());
      setEndDate("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-purple-600" />
            Perpanjang Tanggal
          </DialogTitle>
          <DialogDescription>
            Perpanjang tanggal selesai kegiatan.
            {currentEndDate && (
              <span className="block mt-1 text-xs font-medium text-slate-600">
                Tanggal saat ini:{" "}
                {new Date(currentEndDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="new-end-date">Tanggal Selesai Baru *</Label>
          <Input
            id="new-end-date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={minDate}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!endDate || submitting}>
            {submitting ? "Memproses..." : "Perpanjang"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
