import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { CheckCircle2, Clock, Receipt } from "lucide-react";
import type { EventItem } from "@/shared/types";

function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Tidak ditentukan";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

interface ExpensesSummaryProps {
  event: EventItem;
}

export function ExpensesSummary({ event }: ExpensesSummaryProps) {
  const totalExpenses = event.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const validExpenses = event.expenses?.filter((exp) => exp.isValid) || [];
  const validExpensesTotal = validExpenses.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4 text-primary" />
          Pengeluaran
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!event.expenses || event.expenses.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Belum ada pengeluaran tercatat.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div>
                <p className="text-xs text-slate-500">Total Pengeluaran</p>
                <p className="text-sm font-bold text-slate-900">{formatRupiah(totalExpenses)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Tervalidasi</p>
                <p className="text-sm font-bold text-emerald-600">
                  {formatRupiah(validExpensesTotal)}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {event.expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                      {exp.title}
                      {exp.isValid ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Clock className="h-3 w-3 text-amber-500" />
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(exp.createdAt)}</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatRupiah(exp.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
