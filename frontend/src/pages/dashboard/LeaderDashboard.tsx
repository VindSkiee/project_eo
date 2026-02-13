import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Home, Wallet, Activity } from "lucide-react";

export default function LeaderDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-poppins text-slate-900">Dashboard RW</h1>
        <p className="text-slate-500 mt-1">Ringkasan data dan statistik seluruh warga RW 05.</p>
      </div>

      {/* Grid Statistik */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Total Warga</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">1,245</div>
            <p className="text-xs text-slate-500 mt-1">+4 warga baru bulan ini</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Total RT</CardTitle>
            <Home className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">12</div>
            <p className="text-xs text-slate-500 mt-1">Seluruh RT aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Kas RW (Saldo)</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Rp 15.450.000</div>
            <p className="text-xs text-emerald-600 mt-1 font-medium">Naik 2.5% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Laporan Masuk</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">8</div>
            <p className="text-xs text-amber-600 mt-1 font-medium">3 Butuh tindak lanjut</p>
          </CardContent>
        </Card>
      </div>

      {/* Tempat untuk Tabel/Grafik nanti */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 min-h-[300px] flex items-center justify-center bg-slate-50 border-dashed">
          <p className="text-slate-400">Area Grafik Keuangan (Segera Hadir)</p>
        </Card>
        <Card className="col-span-3 min-h-[300px] flex items-center justify-center bg-slate-50 border-dashed">
          <p className="text-slate-400">Area Laporan Terbaru (Segera Hadir)</p>
        </Card>
      </div>
    </div>
  );
}