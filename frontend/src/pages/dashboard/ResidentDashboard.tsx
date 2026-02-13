import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, Bell, Megaphone } from "lucide-react";

export default function ResidentDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-poppins text-slate-900">Halo, Keluarga Budi!</h1>
        <p className="text-slate-500 mt-1">Selamat datang di portal informasi warga.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card Tagihan */}
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 font-poppins">
              <CreditCard className="h-5 w-5 text-primary" />
              Status Iuran Anda
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-slate-500 mb-1">Tagihan Bulan Ini (Februari)</p>
                <h3 className="text-3xl font-bold text-slate-900">Rp 50.000</h3>
              </div>
              {/* Button menggunakan warna primary, hover brand-green yang sudah diset */}
              <Button className="font-poppins bg-primary hover:bg-brand-green rounded-xl transition-colors">
                Bayar Sekarang
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card Pengumuman */}
        <Card>
          <CardHeader className="pb-4 border-b">
            <CardTitle className="flex items-center gap-2 font-poppins">
              <Megaphone className="h-5 w-5 text-amber-500" />
              Pengumuman Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-4">
              <div className="h-2 w-2 rounded-full bg-primary mt-2"></div>
              <div>
                <h4 className="font-medium text-slate-900">Kerja Bakti Minggu Ini</h4>
                <p className="text-sm text-slate-500 mt-1">Dimohon kehadirannya pada hari Minggu jam 07:00 WIB di lapangan utama.</p>
                <span className="text-xs text-slate-400">2 hari yang lalu</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}