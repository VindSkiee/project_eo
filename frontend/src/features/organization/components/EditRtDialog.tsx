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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { groupService } from "@/features/organization/services/groupService";
import type { GroupItem } from "@/shared/types";

interface EditRtDialogProps {
  group: GroupItem | null;
  name: string;
  onNameChange: (name: string) => void;
  onClose: () => void;
  onSuccess: () => void;
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
}

export function EditRtDialog({
  group,
  name,
  onNameChange,
  onClose,
  onSuccess,
  submitting,
  setSubmitting,
}: EditRtDialogProps) {
  const handleEdit = async () => {
    if (!group || !name.trim()) return;
    setSubmitting(true);
    try {
      await groupService.update(group.id, { name: name.trim() });
      toast.success("RT berhasil diperbarui!");
      onSuccess();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const msg = Array.isArray(message) ? message[0] : message;
      toast.error(msg || "Gagal memperbarui RT.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={group !== null} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-poppins">Edit RT</DialogTitle>
          <DialogDescription>Ubah nama RT yang ada.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-rt-name">Nama RT</Label>
            <Input
              id="edit-rt-name"
              placeholder="Contoh: RT 01"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              className="border-slate-200 focus:border-slate-300"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={handleEdit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
