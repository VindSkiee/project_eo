import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Mail,
    Phone,
    MapPin,
    Building2,
    Save,
    Loader2,
    Camera,
    KeyRound,
    User,
} from "lucide-react";
import { toast } from "sonner";
import imageCompression from "browser-image-compression";
import { dashboardService, type UserItem } from "@/services/dashboardService";

const roleLabel = (roleType: string) => {
    switch (roleType) {
        case "LEADER": return "Ketua RW";
        case "ADMIN": return "Ketua RT";
        case "TREASURER": return "Bendahara";
        default: return "Warga";
    }
};

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
            const data = await dashboardService.getProfile();
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
            await dashboardService.updateProfile({
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
            await dashboardService.changePassword({
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
            // Compress image
            const compressed = await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                fileType: "image/webp",
                useWebWorker: true,
            });

            // Upload
            try {
                await dashboardService.uploadFile(compressed);
                toast.success("Foto profil berhasil diupload!");
                fetchProfile();
            } catch {
                // Storage backend is a stub — mock success
                toast.info("Upload belum tersedia di server, namun kompresi gambar berhasil.");
            }
        } catch {
            toast.error("Gagal mengompresi gambar.");
        } finally {
            setUploading(false);
            // Reset input
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

            {/* Profile Header Card */}
            <Card>
                <CardContent className="py-6 sm:py-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                        {/* Avatar with upload overlay */}
                        <div className="relative group">
                            <Avatar className="h-20 w-20 border-2 border-primary/10 shadow-md">
                                <AvatarFallback className="bg-primary/5 text-primary font-bold text-2xl font-poppins">
                                    {profile.fullName?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <label
                                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                                title="Ganti foto"
                            >
                                {uploading ? (
                                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-5 w-5 text-white" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="flex-1 text-center sm:text-left space-y-1.5">
                            <h2 className="text-xl font-bold text-slate-900 font-poppins">
                                {profile.fullName}
                            </h2>
                            <div className="flex items-center gap-2 justify-center sm:justify-start">
                                {/* Perhatikan akses ke profile.role.type */}
                                <Badge variant="default">
                                    {profile.roleType ? roleLabel(profile.roleType) : "User"}
                                </Badge>

                                <Badge variant={profile.isActive ? "default" : "destructive"} className="text-[10px]">
                                    {profile.isActive ? "Aktif" : "Nonaktif"}
                                </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-sm text-slate-500 mt-2">
                                <span className="flex items-center gap-1.5">
                                    <Mail className="h-3.5 w-3.5" /> {profile.email}
                                </span>
                                {profile.phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="h-3.5 w-3.5" /> {profile.phone}
                                    </span>
                                )}
                                {profile.address && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-3.5 w-3.5" /> {profile.address}
                                    </span>
                                )}
                                {profile.communityGroup && (
                                    <span className="flex items-center gap-1.5">
                                        <Building2 className="h-3.5 w-3.5" /> {profile.communityGroup.name}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Profile Form */}
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
                                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                                placeholder="Masukkan nama lengkap"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profile-phone">Nomor Telepon</Label>
                            <Input
                                id="profile-phone"
                                value={form.phone}
                                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                placeholder="08xxxxxxxxxx"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="profile-address">Alamat</Label>
                            <Input
                                id="profile-address"
                                value={form.address}
                                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                                placeholder="Masukkan alamat"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSaveProfile} disabled={saving}>
                            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                            Simpan Perubahan
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Separator />

            {/* Change Password */}
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
                        {!showPassword && (
                            <Button variant="outline" size="sm" onClick={() => setShowPassword(true)}>
                                Ubah
                            </Button>
                        )}
                    </div>
                </CardHeader>
                {showPassword && (
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="old-pwd">Password Lama *</Label>
                            <Input
                                id="old-pwd"
                                type="password"
                                value={passwordForm.oldPassword}
                                onChange={(e) => setPasswordForm((f) => ({ ...f, oldPassword: e.target.value }))}
                                placeholder="Masukkan password lama"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-pwd">Password Baru *</Label>
                                <Input
                                    id="new-pwd"
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                                    placeholder="Minimal 6 karakter"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-pwd">Konfirmasi Password *</Label>
                                <Input
                                    id="confirm-pwd"
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                                    placeholder="Ulangi password baru"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowPassword(false);
                                    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
                                }}
                            >
                                Batal
                            </Button>
                            <Button onClick={handleChangePassword} disabled={savingPassword}>
                                {savingPassword ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <KeyRound className="h-4 w-4 mr-1" />}
                                Simpan Password
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
