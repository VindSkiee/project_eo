import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Wallet, ArrowUpRight, ArrowDownRight, FileText, Plus } from "lucide-react";

export default function FinanceDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-poppins text-slate-900">Dashboard Keuangan</h1>
          <p className="text-slate-500 mt-1">Ringkasan arus kas, iuran warga, dan pengeluaran.</p>
        </div>
        {/* Tombol Aksi Cepat Bendahara */}
        <div className="flex gap-2">
          <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
            Unduh Laporan
          </Button>
          <Button className="bg-primary hover:bg-brand-green transition-colors font-poppins">
            <Plus className="h-4 w-4 mr-2" />
            Catat Pengeluaran
          </Button>
        </div>
      </div>

      {/* Grid 4 Kartu Utama */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Saldo Utama */}
        <Card className="border-primary/20 shadow-sm relative overflow-hidden">
          {/* Aksen warna kecil di atas card */}
          <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-6">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Total Saldo Kas</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Rp 15.450.000</div>
            <p className="text-xs text-slate-500 mt-1">Akumulasi seluruh RT</p>
          </CardContent>
        </Card>

        {/* Pemasukan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Pemasukan (Bulan Ini)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Rp 3.200.000</div>
            <p className="text-xs text-slate-500 mt-1">Dari 64 Warga (Iuran Bulanan)</p>
          </CardContent>
        </Card>

        {/* Pengeluaran */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Pengeluaran (Bulan Ini)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">Rp 850.000</div>
            <p className="text-xs text-slate-500 mt-1">Perbaikan lampu & kebersihan</p>
          </CardContent>
        </Card>

        {/* Menunggu Persetujuan */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">Pengajuan Dana</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">3</div>
            <p className="text-xs text-amber-600 mt-1 font-medium">Butuh review Anda</p>
          </CardContent>
        </Card>
      </div>

      {/* Bagian Bawah: Transaksi Terakhir */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="font-poppins text-lg">Transaksi Terakhir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Item Transaksi Masuk */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Iuran Warga - RT 01</p>
                  <p className="text-xs text-slate-500">Bapak Andi (Blok A/12) • 13 Feb 2026</p>
                </div>
              </div>
              <div className="text-sm font-bold text-emerald-600">+ Rp 50.000</div>
            </div>

            {/* Item Transaksi Keluar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <ArrowDownRight className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Perbaikan Fasilitas</p>
                  <p className="text-xs text-slate-500">Beli Lampu Jalan Gang 3 • 10 Feb 2026</p>
                </div>
              </div>
              <div className="text-sm font-bold text-red-600">- Rp 150.000</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}