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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Plus, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/shared/services/userService";
import type { GroupItem } from "@/shared/types";

interface CreateWargaDialogProps {
  groups: GroupItem[];
  onSuccess: () => void;
}

export function CreateWargaDialog({ groups, onSuccess }: CreateWargaDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    password: "",
    phone: "",
    address: "",
    roleType: "RESIDENT",
    communityGroupId: undefined as number | undefined,
  });

  const handleCreate = async () => {
    if (!form.email || !form.fullName) {
      toast.error("Email dan Nama Lengkap wajib diisi.");
      return;
    }
    if (!form.password || form.password.length < 6) {
      toast.error("Password wajib diisi, minimal 6 karakter.");
      return;
    }
    setSubmitting(true);
    try {
      await userService.create({
        email: form.email,
        fullName: form.fullName,
        password: form.password,
        phone: form.phone === "" ? undefined : form.phone,
        address: form.address === "" ? undefined : form.address,
        roleType: form.roleType,
        communityGroupId: form.communityGroupId ? Number(form.communityGroupId) : undefined,
      });

      toast.success("Warga berhasil ditambahkan!");
      setOpen(false);
      setForm({
        email: "",
        fullName: "",
        password: "",
        phone: "",
        address: "",
        roleType: "RESIDENT",
        communityGroupId: undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      console.error(err);
      const message = (err as any)?.response?.data?.message;
      const msg = Array.isArray(message) ? message[0] : (message || "Gagal menambahkan warga.");
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
          Tambah Warga
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl"> {/* <-- Lebar diperbesar */}
        <DialogHeader>
          <DialogTitle className="font-poppins">Tambah Warga Baru</DialogTitle>
          <DialogDescription>
            Masukkan data warga baru. Warga akan login menggunakan password yang Anda tetapkan.
          </DialogDescription>
        </DialogHeader>

        {/* Menggunakan grid 2 kolom pada layar sm ke atas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2 px-2 -mx-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="warga-email">Email *</Label>
            <Input
              id="warga-email"
              type="email"
              placeholder="warga@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warga-name">Nama Lengkap *</Label>
            <Input
              id="warga-name"
              placeholder="Nama lengkap"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warga-password">Password *</Label>
            <div className="relative">
              <Input
                id="warga-password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warga-phone">No. Telepon</Label>
            <Input
              id="warga-phone"
              placeholder="08xxxxxxxxx"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2 sm:col-span-2"> {/* <-- Memakan 2 kolom penuh */}
            <Label htmlFor="warga-address">Alamat</Label>
            <Input
              id="warga-address"
              placeholder="Alamat rumah"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={form.roleType}
              onValueChange={(v) => setForm({ ...form, roleType: v })}
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
                setForm({ ...form, communityGroupId: v ? Number(v) : undefined })
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

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
