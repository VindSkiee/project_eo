import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Separator } from "@/shared/ui/separator";
import { User } from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { userService } from "@/shared/services/userService";
import type { UserItem } from "@/shared/types";
import { emitSidebarUpdate } from "@/shared/helpers/sidebarEvents";
import {
    ProfileHeader,
    EditProfileForm,
    ChangePasswordForm,
} from "@/features/profile/components";

export default function ProfilePage() {
    const [profile, setProfile] = useState<UserItem | null>(null);
    const [loading, setLoading] = useState(true);

    // Edit form
    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        address: "",
    });
    const [saving, setSaving] = useState(false);

    // Password change
    const [showPassword, setShowPassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [savingPassword, setSavingPassword] = useState(false);

    // Photo upload
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const data = await userService.getProfile();
            setProfile(data);
            setForm({
                fullName: data.fullName || "",
                phone: data.phone || "",
                address: data.address || "",
            });
        } catch {
            toast.error("Gagal memuat data profil.");
        } finally {
            setLoading(false);
        }
    };

    // === Save profile ===
    const handleSaveProfile = async () => {
        if (!form.fullName.trim()) {
            toast.error("Nama lengkap wajib diisi.");
            return;
        }
        setSaving(true);
        try {
            await userService.updateProfile({
                fullName: form.fullName.trim(),
                phone: form.phone.trim() || undefined,
                address: form.address.trim() || undefined,
            });
            toast.success("Profil berhasil diperbarui!");

            // Also update localStorage user name
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    user.fullName = form.fullName.trim();
                    localStorage.setItem("user", JSON.stringify(user));
                } catch { /* ignore */ }
            }

            emitSidebarUpdate();
            fetchProfile();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message || "Gagal memperbarui profil.");
        } finally {
            setSaving(false);
        }
    };

    // === Change password ===
    const handleChangePassword = async () => {
        if (!passwordForm.oldPassword || !passwordForm.newPassword) {
            toast.error("Password lama dan baru wajib diisi.");
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            toast.error("Password baru minimal 6 karakter.");
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("Konfirmasi password tidak cocok.");
            return;
        }
        setSavingPassword(true);
        try {
            await userService.changePassword({
                currentPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
            });
            toast.success("Password berhasil diubah!");
            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
            setShowPassword(false);
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message || "Gagal mengubah password.");
        } finally {
            setSavingPassword(false);
        }
    };

    // === Photo upload with compression ===
    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // Compress image on client before uploading
            const compressed = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                fileType: "image/webp",
                useWebWorker: true,
            });

            // Upload to backend (server also compresses with sharp)
            const updatedUser = await userService.uploadAvatar(compressed);
            toast.success("Foto profil berhasil diupload!");

            // Update localStorage with new profileImage
            const userStr = localStorage.getItem("user");
            if (userStr) {
                try {
                    const stored = JSON.parse(userStr);
                    stored.profileImage = updatedUser.profileImage;
                    localStorage.setItem("user", JSON.stringify(stored));
                } catch { /* ignore */ }
            }

            emitSidebarUpdate();
            fetchProfile();
        } catch {
            toast.error("Gagal mengupload foto profil.");
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <Skeleton className="h-8 w-48" />
                <Card>
                    <CardContent className="py-8 space-y-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-4 w-60" />
                            </div>
                        </div>
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-10 w-full" />
                        ))}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <User className="h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">Gagal memuat profil.</p>
                <Button variant="outline" className="mt-3" onClick={fetchProfile}>
                    Coba Lagi
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
                    Profil Saya
                </h1>
                <p className="text-sm sm:text-base text-slate-500 mt-1">
                    Kelola informasi pribadi dan keamanan akun Anda.
                </p>
            </div>

            <ProfileHeader
                profile={profile}
                uploading={uploading}
                onPhotoUpload={handlePhotoUpload}
            />

            <EditProfileForm
                form={form}
                onChange={setForm}
                onSave={handleSaveProfile}
                saving={saving}
            />

            <Separator />

            <ChangePasswordForm
                show={showPassword}
                onToggle={setShowPassword}
                form={passwordForm}
                onChange={setPasswordForm}
                onSave={handleChangePassword}
                saving={savingPassword}
            />
        </div>
    );
}
