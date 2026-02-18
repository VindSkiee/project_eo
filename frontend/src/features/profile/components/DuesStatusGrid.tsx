import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Shield, CheckCircle2, XCircle } from "lucide-react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
];

interface DuesStatusGridProps {
  paidMonths: Set<number>;
  currentYear: number;
}

export function DuesStatusGrid({ paidMonths, currentYear }: DuesStatusGridProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg font-poppins flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Status Iuran {currentYear}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {MONTHS.map((month, idx) => {
            const isPaid = paidMonths.has(idx);
            const isFuture = idx > new Date().getMonth();

            return (
              <div
                key={idx}
                className={`
                  relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all
                  ${isPaid
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : isFuture
                    ? "border-slate-100 bg-slate-50/50 text-slate-400"
                    : "border-red-200 bg-red-50 text-red-600"
                  }
                `}
              >
                {isPaid && (
                  <CheckCircle2 className="h-5 w-5 mb-1" />
                )}
                {!isPaid && !isFuture && (
                  <XCircle className="h-5 w-5 mb-1" />
                )}
                <span className="text-xs font-semibold">{month}</span>
                <span className="text-[10px] mt-0.5">
                  {isPaid ? "Lunas" : isFuture ? "—" : "Belum"}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
            Lunas
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
            Belum Bayar
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" />
            Belum Jatuh Tempo
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
