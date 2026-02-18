import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom"; // 1. IMPORT INI

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Loader2 } from "lucide-react";

// Pastikan path ini sesuai dengan struktur folder Anda
// Jika belum ada, buat file dummy atau hapus import ini sementara
import { authService } from "@/features/auth/services/authService";
import axios from "axios";
import { AccountInfoCards } from "@/shared/components/AccountInfoCards";

// Schema Validasi
const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email tidak valid"),
  password: z.string().min(6, "Kata sandi minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  // 2. INISIALISASI HOOK DISINI (Wajib di dalam component)
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Fungsi Login
  const onValid = async (data: LoginFormValues) => {
    setIsLoading(true);

    try {
      const result = await authService.login(data.email, data.password);

      // HANYA simpan data user (sebagai flag UI). 
      // Token-nya sudah otomatis masuk ke dalam Cookie browser!
      localStorage.setItem("user", JSON.stringify(result.user));

      toast.success("Login Berhasil!", {
        description: `Selamat datang kembali, ${result.user.fullName || result.user.email}`,
        duration: 2000,
      });

      // Redirect Pintar Sesuai Role
      const role = result.user.role;
      if (role === "LEADER") navigate("/dashboard/rw");
      else if (role === "ADMIN") navigate("/dashboard/rt");
      else if (role === "TREASURER") navigate("/dashboard/finance");
      else navigate("/dashboard/warga");

    } catch (error: any) {
      // ... kode error handling tetap sama ...
      let message = "Terjadi kesalahan server.";

      // Handle Error Axios/Backend
      if (axios.isAxiosError(error) && error.response) {
        // Cek apakah error message berupa array (dari class-validator backend)
        const msg = error.response.data.message;
        message = Array.isArray(msg) ? msg[0] : (msg || message);
      }

      toast.error("Gagal Masuk", {
        description: message,
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onInvalid = (errors: any) => {
    const firstErrorKey = Object.keys(errors)[0];
    toast.error("Gagal Masuk", {
      description: errors[firstErrorKey]?.message || "Periksa kembali input Anda",
    });
  };

  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2">
      {/* LEFT SIDE */}
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex justify-center items-start overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/images/login.leftside2.webp" alt="Background" className="w-full h-full object-cover mix-blend-overlay" />
        </div>
        
        {/* Account Info Cards - Top Left */}
        <div className="relative z-10 self-start">
          <AccountInfoCards />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center py-16 bg-white px-4 sm:px-6 lg:px-8 font-poppins">
        <div className="mx-auto w-full max-w-[440px] grid gap-6 md:gap-8">
          <div className="flex flex-col gap-2 text-center">
            <img src="/images/logoRB.webp" alt="Logo RB" className="h-20 w-auto mx-auto" />
          </div>
          <p className="text-xs md:text-sm text-slate-500 px-4 md:px-0 text-center">
            Masuk menggunakan email dan kata sandi Anda.
          </p>

          <form onSubmit={handleSubmit(onValid, onInvalid)} className="grid gap-5 md:gap-6" noValidate>

            {/* Email Field */}
            <div className="grid gap-2 md:gap-3">
              <Label htmlFor="email" className="text-slate-700 font-medium text-left">Email</Label>
              <Input
                id="email"
                type="email"
                disabled={isLoading}
                {...register("email")}
                className={`h-12 bg-white border-slate-300 focus-visible:ring-ring rounded-3xl px-4 ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>

            {/* Password Field */}
            <div className="grid gap-2 md:gap-3">
              <Label htmlFor="password" className="text-slate-700 font-medium text-left">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                disabled={isLoading}
                {...register("password")}
                className={`h-12 bg-white border-slate-300 focus-visible:ring-ring rounded-3xl px-4 ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full bg-primary hover:bg-brand-green text-lg font-medium mt-2 rounded-3xl transition-colors duration-300"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}