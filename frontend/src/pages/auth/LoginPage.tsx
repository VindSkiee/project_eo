import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  // Simulasi handle login
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      alert("Simulasi Login Berhasil! Nanti diredirect ke dashboard.");
      // Nanti di sini logika redirect menggunakan useNavigate
    }, 2000);
  }

  return (
    // Container Utama: Grid 2 Kolom pada layar besar (lg), 1 kolom pada mobile
    <div className="w-full min-h-screen grid lg:grid-cols-2">
      
      {/* --- LEFT SIDE (Branding & Abstract) --- */}
      {/* Hidden di mobile, Flex di layar besar (lg:flex) */}
      <div className="relative hidden h-full flex-col bg-slate-900 p-10 text-white lg:flex justify-center items-start overflow-hidden">
        {/* Overlay Background Image & Gradient */}
        <div className="absolute inset-0 z-0">
            {/* Ganti src dengan gambar abstrak pilihan Anda */}
            <img 
                src="/images/login-bg.jpg" 
                alt="Background Abstrak" 
                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
             {/* Gradient Overlay agar teks lebih terbaca & sesuai warna brand */}
            <div className="absolute inset-0 bg-linear-to-t from-indigo-900/80 to-slate-900/60 mix-blend-multiply" />
        </div>
        
        {/* Content Overlay (Z-Index lebih tinggi) */}
        <div className="relative z-20 flex flex-col items-start gap-8 max-w-lg ml-8">
            {/* Logo Image */}
            {/* Pastikan file logo Anda berwarna PUTIH dan disimpan di public/images/ */}
            <img 
                src="/images/logo-mk-white.png" 
                alt="MK Logo" 
                className="h-20 w-auto mb-4"
            />

            <h1 className="text-4xl font-bold tracking-tight lg:text-6xl font-poppins leading-tight">
                Design <br/> with us.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed font-poppins">
               Bergabunglah dengan komunitas digital kami. Kelola lingkungan RT/RW Anda dengan lebih transparan, terstruktur, dan efisien dalam satu platform terpadu.
            </p>
        </div>
      </div>

      {/* --- RIGHT SIDE (Login Form) --- */}
      <div className="flex items-center justify-center py-12 bg-white">
        <div className="mx-auto grid w-95 gap-8 pl-8 pr-8 md:pl-0 md:pr-0">
          
          {/* Header Login */}
          <div className="flex flex-col gap-2 text-left">
            <h1 className="text-3xl font-semibold tracking-tight font-poppins text-slate-900">
              Sign in
            </h1>
            <p className="text-sm text-slate-500">
              Masuk menggunakan email dan kata sandi Anda untuk melanjutkan.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="grid gap-6">
            
            {/* Email Field */}
            <div className="grid gap-3">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                placeholder="nama@warga.id"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading}
                className="h-12 bg-slate-50 border-slate-300 focus-visible:ring-indigo-600 rounded-3xl"
                required
              />
            </div>

            {/* Password Field */}
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                disabled={isLoading}
                className="h-12 bg-slate-50 border-slate-300 focus-visible:ring-indigo-600 rounded-3xl"
                required
              />
              {/* Catatan: Untuk fitur "Hide/Show" password di dalam input seperti desain Figma, 
                  diperlukan komponen Input kustom yang sedikit lebih kompleks. 
                  Untuk tahap awal, kita pakai standar dulu. */}
            </div>

            {/* Submit Button */}
            {/* Menggunakan warna primary Indigo */}
            <Button 
                type="submit" 
                disabled={isLoading} 
                className="h-12 w-full bg-indigo-600 hover:bg-indigo-700 text-lg font-medium mt-2 rounded-3xl"
            >
              {isLoading && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              Sign In
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}