import { useState } from "react";
import { useForm } from "react-hook-form"; // <--- Hook utama
import { zodResolver } from "@hookform/resolvers/zod"; // <--- Penghubung Zod
import { z } from "zod"; // <--- Pembuat Aturan
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

// 1. DEFINE SCHEMA (Aturan Validasi)
// Enaknya Zod: Kita definisikan pesan error disini, bukan di logic render
const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email wajib diisi" })
    .email({ message: "Format email tidak valid (contoh: user@warga.id)" }),
  password: z
    .string()
    .min(6, { message: "Kata sandi minimal 6 karakter" }),
});

// Extract tipe data otomatis dari schema (biar TypeScript senang)
type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  // 2. SETUP FORM
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema), // Sambungkan aturan Zod tadi
  });

  // 3. FUNGSI JIKA SUKSES (Validasi Lolos)
  const onValid = async (data: LoginFormValues) => {
    setIsLoading(true);
    
    // Simulasi API Call
    setTimeout(() => {
      console.log("Data terkirim:", data); // Data sudah bersih & valid
      setIsLoading(false);
      
      toast.success("Login Berhasil!", {
        description: "Mengalihkan ke dashboard...",
        duration: 2000,
      });
      // Navigate disini
    }, 2000);
  };

  // 4. FUNGSI JIKA GAGAL (Validasi Error)
  // Ini yang akan memunculkan "Cool Alert" secara otomatis!
  const onInvalid = (errors: any) => {
    // Ambil error pertama yang ditemukan
    const firstErrorKey = Object.keys(errors)[0];
    const errorMessage = errors[firstErrorKey].message;

    toast.error("Gagal Masuk", {
      description: errorMessage, // Pesan diambil dari Schema Zod di atas
      duration: 3000,
    });
  };

  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2">
      {/* LEFT SIDE (Tidak Berubah) */}
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex justify-center items-start overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/login.leftside2.webp"
            alt="Background"
            className="w-full h-full object-cover mix-blend-overlay"
          />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex items-center justify-center py-16 bg-white px-4 sm:px-6 lg:px-8 font-poppins">
        <div className="mx-auto w-full max-w-[440px] grid gap-6 md:gap-8">
          <div className="flex flex-col gap-2 text-center">
            <img src="/images/logoRB.webp" alt="Logo RB" className="h-48 w-auto mx-auto" />
            <p className="text-xs md:text-sm text-slate-500 px-4 md:px-0">
              Masuk menggunakan email dan kata sandi Anda.
            </p>
          </div>

          {/* FORM SETUP:
              - noValidate: Matikan validasi browser
              - onSubmit: Gunakan handleSubmit dari hook (bukan function manual kita)
          */}
          <form 
            onSubmit={handleSubmit(onValid, onInvalid)} 
            className="grid gap-5 md:gap-6" 
            noValidate
          >
            {/* Email Field */}
            <div className="grid gap-2 md:gap-3">
              <Label htmlFor="email" className="text-slate-700 font-medium text-sm md:text-base text-left">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                disabled={isLoading}
                // REGISTRASI INPUT KE HOOK:
                {...register("email")} 
                className={`h-10 md:h-12 bg-slate-50 border-slate-300 focus-visible:ring-blue-900 rounded-3xl px-4 text-sm md:text-base font-poppins ${errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
              {/* Optional: Tampilkan error text kecil dibawah input juga */}
              {/* {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>} */}
            </div>

            {/* Password Field */}
            <div className="grid gap-2 md:gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-medium text-sm md:text-base">
                  Kata Sandi
                </Label>
              </div>
              <Input
                id="password"
                type="password"
                disabled={isLoading}
                // REGISTRASI INPUT KE HOOK:
                {...register("password")}
                className={`h-10 md:h-12 bg-slate-50 border-slate-300 focus-visible:ring-indigo-900 rounded-3xl px-4 text-sm md:text-base font-poppins ${errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-10 md:h-12 w-full bg-[#072C52] hover:bg-[#018454] text-base md:text-lg font-medium mt-2 rounded-3xl font-poppins transition-colors"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />}
              Masuk
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}