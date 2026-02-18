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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/shared/services/userService";
import type { GroupItem, UserItem } from "@/shared/types";

interface EditWargaDialogProps {
  user: UserItem | null;
  groups: GroupItem[];
  form: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    roleType: string;
    communityGroupId: number | undefined;
  };
  onFormChange: (form: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    roleType: string;
    communityGroupId: number | undefined;
  }) => void;
  onClose: () => void;
  onSuccess: () => void;
  submitting: boolean;
  setSubmitting: (submitting: boolean) => void;
}

export function EditWargaDialog({
  user,
  groups,
  form,
  onFormChange,
  onClose,
  onSuccess,
  submitting,
  setSubmitting,
}: EditWargaDialogProps) {
  const handleEdit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await userService.update(user.id, {
        fullName: form.fullName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        roleType: form.roleType,
        communityGroupId: form.communityGroupId ? Number(form.communityGroupId) : undefined,
      });

      toast.success("Data warga berhasil diperbarui!");
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      const message = (err as any)?.response?.data?.message;
      const msg = Array.isArray(message) ? message[0] : (message || "Gagal memperbarui data warga.");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={user !== null} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-poppins">Edit Data Warga</DialogTitle>
          <DialogDescription>Ubah data warga yang ada.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="edit-fullname">Nama Lengkap</Label>
            <Input
              id="edit-fullname"
              placeholder="Nama lengkap"
              value={form.fullName}
              onChange={(e) => onFormChange({ ...form, fullName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">No. Telepon</Label>
            <Input
              id="edit-phone"
              placeholder="08xxxxxxxxxx"
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Alamat</Label>
            <Input
              id="edit-address"
              placeholder="Alamat rumah"
              value={form.address}
              onChange={(e) => onFormChange({ ...form, address: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.roleType}
              onValueChange={(v) => onFormChange({ ...form, roleType: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RESIDENT">Warga</SelectItem>
                <SelectItem value="ADMIN">Ketua RT</SelectItem>
                <SelectItem value="TREASURER">Bendahara</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kelompok (RT)</Label>
            <Select
              value={form.communityGroupId?.toString() || ""}
              onValueChange={(v) =>
                onFormChange({ ...form, communityGroupId: v ? Number(v) : undefined })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih RT" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id.toString()}>
                    {g.name} ({g.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
