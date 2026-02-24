import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Shield, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
];

export interface DuesStatusGridProps {
  targetYear: number;
  createdAt?: string; // Waktu akun dibuat (untuk start bulan)
  lastPaidPeriod?: string | null; // Tracker lunas akumulatif
  contributions?: Array<{ month: number; year: number }>; // History bayar eceran (opsional)
}

export function DuesStatusGrid({ 
  targetYear, 
  createdAt, 
  lastPaidPeriod, 
  contributions = [] 
}: DuesStatusGridProps) {
  
  const realCurrentYear = new Date().getFullYear();
  const realCurrentMonth = new Date().getMonth() + 1;

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base sm:text-lg font-poppins flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Status Iuran Tahun {targetYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {MONTHS.map((monthName, idx) => {
            const currentCellMonth = idx + 1;

            // 1. Cek apakah warga sudah terdaftar di bulan ini (berdasarkan createdAt)
            let existed = true;
            if (createdAt) {
              const cDate = new Date(createdAt);
              const cYear = cDate.getFullYear();
              const cMonth = cDate.getMonth() + 1;
              existed = targetYear > cYear || (targetYear === cYear && currentCellMonth >= cMonth);
            }

            // 2. Cek apakah bulan tersebut ada di masa depan
            const isFuture = targetYear > realCurrentYear || (targetYear === realCurrentYear && currentCellMonth > realCurrentMonth);

            // 3. Cek apakah Lunas
            let isPaid = false;
            if (existed) {
              // Cek via array contributions
              const hasContrib = contributions.some(c => c.month === currentCellMonth && c.year === targetYear);
              if (hasContrib) {
                isPaid = true;
              } else if (lastPaidPeriod) {
                // Cek via tracker akumulasi (lastPaidPeriod)
                const lp = new Date(lastPaidPeriod);
                const lpYear = lp.getFullYear();
                const lpMonth = lp.getMonth() + 1;
                if (lpYear > targetYear || (lpYear === targetYear && lpMonth >= currentCellMonth)) {
                  isPaid = true;
                }
              }
            }

            // Tentukan style visual berdasarkan status di atas
            let stateClasses = "";
            let IconComponent = null;
            let statusLabel = "";

            if (!existed) {
              stateClasses = "border-slate-100 bg-slate-50/50 text-slate-400 opacity-60";
              IconComponent = MinusCircle;
              statusLabel = "Tidak Terdaftar";
            } else if (isPaid) {
              stateClasses = "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm";
              IconComponent = CheckCircle2;
              statusLabel = "Lunas";
            } else if (isFuture) {
              stateClasses = "border-slate-100 bg-slate-50/50 text-slate-400";
              IconComponent = MinusCircle;
              statusLabel = "Jatuh Tempo";
            } else {
              stateClasses = "border-red-200 bg-red-50 text-red-600 shadow-sm";
              IconComponent = XCircle;
              statusLabel = "Belum Bayar";
            }

            return (
              <div
                key={idx}
                className={`
                  relative flex flex-col items-center justify-center rounded-xl border-2 p-3 transition-all
                  ${stateClasses}
                `}
              >
                {IconComponent && <IconComponent className="h-5 w-5 mb-1.5" strokeWidth={2.5} />}
                <span className="text-sm font-bold tracking-wide">{monthName}</span>
                <span className="text-[9px] sm:text-[10px] mt-1 font-medium text-center leading-tight">
                  {statusLabel}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend / Keterangan */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-emerald-100 border-2 border-emerald-200 block" />
            Lunas
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-red-100 border-2 border-red-200 block" />
            Belum Bayar
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border-2 border-slate-200 block" />
            Belum Jatuh Tempo
          </span>
          <span className="flex items-center gap-1.5 opacity-60">
            <span className="w-3.5 h-3.5 rounded bg-slate-50 border-2 border-slate-100 block" />
            Tidak Terdaftar
          </span>
        </div>
      </CardContent>
    </Card>
  );
}