import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { groupService } from "@/features/organization/services/groupService";

interface CreateRtDialogProps {
  onSuccess: () => void;
}

export function CreateRtDialog({ onSuccess }: CreateRtDialogProps) {
  const [open, setOpen] = useState(false);
  const [rtName, setRtName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!rtName.trim()) {
      toast.error("Nama RT harus diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await groupService.create({ name: rtName.trim(), type: "RT" });
      toast.success("RT berhasil ditambahkan!");
      setOpen(false);
      setRtName("");
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      const message = (err as any)?.response?.data?.message;
      const msg = Array.isArray(message) ? message[0] : (message || "Gagal menambahkan RT.");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-10 px-4 bg-primary hover:bg-brand-green text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Tambah RT
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-poppins">Tambah RT Baru</DialogTitle>
          <DialogDescription>
            Masukkan nama RT dengan format "RT XX" (contoh: RT 01).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="rt-name">Nama RT</Label>
            <Input
              id="rt-name"
              placeholder="Contoh: RT 01"
              value={rtName}
              onChange={(e) => setRtName(e.target.value)}
              className="border-slate-200 focus:border-slate-300"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button
            onClick={handleCreate}
            disabled={submitting}
            className="bg-primary hover:bg-brand-green text-white"
          >
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
