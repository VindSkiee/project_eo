import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Save, Loader2, User } from "lucide-react";

interface EditProfileFormProps {
  form: { fullName: string; phone: string; address: string };
  onChange: (form: { fullName: string; phone: string; address: string }) => void;
  onSave: () => void;
  saving: boolean;
}

export function EditProfileForm({ form, onChange, onSave, saving }: EditProfileFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg font-poppins flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          Edit Profil
        </CardTitle>
        <CardDescription>Perbarui informasi pribadi Anda.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="profile-name">Nama Lengkap *</Label>
            <Input
              id="profile-name"
              value={form.fullName}
              onChange={(e) => onChange({ ...form, fullName: e.target.value })}
              placeholder="Masukkan nama lengkap"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-phone" className="flex items-center gap-2">
              Nomor Telepon
              {!form.phone.trim() && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">!</span>
              )}
            </Label>
            <Input
              id="profile-phone"
              value={form.phone}
              onChange={(e) => onChange({ ...form, phone: e.target.value })}
              placeholder="08xxxxxxxxxx"
              className={!form.phone.trim() ? "border-red-300 focus-visible:ring-red-400" : ""}
            />
            {!form.phone.trim() && (
              <p className="text-xs text-red-500">Nomor telepon belum diisi.</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profile-address" className="flex items-center gap-2">
              Alamat
              {!form.address.trim() && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">!</span>
              )}
            </Label>
            <Input
              id="profile-address"
              value={form.address}
              onChange={(e) => onChange({ ...form, address: e.target.value })}
              placeholder="Masukkan alamat"
              className={!form.address.trim() ? "border-red-300 focus-visible:ring-red-400" : ""}
            />
            {!form.address.trim() && (
              <p className="text-xs text-red-500">Alamat belum diisi.</p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Simpan Perubahan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
