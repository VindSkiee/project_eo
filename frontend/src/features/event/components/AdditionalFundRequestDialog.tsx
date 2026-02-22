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
import { Loader2, Banknote } from "lucide-react";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface AdditionalFundRequestDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number, description: string) => Promise<void>;
  currentBudget: number;
}

export function AdditionalFundRequestDialog({
  open,
  onClose,
  onSubmit,
  currentBudget,
}: AdditionalFundRequestDialogProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const numAmount = parseFloat(amount) || 0;
  const isValid = numAmount > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await onSubmit(numAmount, description.trim());
      setAmount("");
      setDescription("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setAmount("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-poppins flex items-center gap-2">
            <Banknote className="h-5 w-5 text-blue-600" />
            Ajukan Dana Tambahan
          </DialogTitle>
          <DialogDescription>
            Ajukan dana tambahan dari kas RW untuk kegiatan ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current budget info */}
          <div className="rounded-lg bg-slate-50 p-3 space-y-1">
            <p className="text-xs text-slate-500">Anggaran saat ini</p>
            <p className="text-sm font-semibold text-slate-900">
              {formatRupiah(currentBudget)}
            </p>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="additional-amount">Nominal Dana Tambahan *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                Rp
              </span>
              <Input
                id="additional-amount"
                type="number"
                min="1"
                placeholder="Contoh: 500000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
              />
            </div>
            {numAmount > 0 && (
              <p className="text-xs text-slate-500">
                Total anggaran setelah tambahan:{" "}
                <span className="font-medium text-slate-700">
                  {formatRupiah(currentBudget + numAmount)}
                </span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="additional-desc">Alasan / Deskripsi *</Label>
            <Textarea
              id="additional-desc"
              placeholder="Jelaskan alasan pengajuan dana tambahan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Ajukan Dana
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
