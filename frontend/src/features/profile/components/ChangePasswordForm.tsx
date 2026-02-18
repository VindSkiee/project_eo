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
import { Loader2, KeyRound } from "lucide-react";

interface ChangePasswordFormProps {
  show: boolean;
  onToggle: (show: boolean) => void;
  form: { oldPassword: string; newPassword: string; confirmPassword: string };
  onChange: (form: { oldPassword: string; newPassword: string; confirmPassword: string }) => void;
  onSave: () => void;
  saving: boolean;
}

export function ChangePasswordForm({
  show,
  onToggle,
  form,
  onChange,
  onSave,
  saving,
}: ChangePasswordFormProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base sm:text-lg font-poppins flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Ubah Password
            </CardTitle>
            <CardDescription>Perbarui password akun Anda.</CardDescription>
          </div>
          {!show && (
            <Button variant="outline" size="sm" onClick={() => onToggle(true)}>
              Ubah
            </Button>
          )}
        </div>
      </CardHeader>
      {show && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="old-pwd">Password Lama *</Label>
            <Input
              id="old-pwd"
              type="password"
              value={form.oldPassword}
              onChange={(e) => onChange({ ...form, oldPassword: e.target.value })}
              placeholder="Masukkan password lama"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-pwd">Password Baru *</Label>
              <Input
                id="new-pwd"
                type="password"
                value={form.newPassword}
                onChange={(e) => onChange({ ...form, newPassword: e.target.value })}
                placeholder="Minimal 6 karakter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-pwd">Konfirmasi Password *</Label>
              <Input
                id="confirm-pwd"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => onChange({ ...form, confirmPassword: e.target.value })}
                placeholder="Ulangi password baru"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onToggle(false);
                onChange({ oldPassword: "", newPassword: "", confirmPassword: "" });
              }}
            >
              Batal
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />}
              Simpan Password
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
