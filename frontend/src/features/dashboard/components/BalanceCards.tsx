import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Wallet } from "lucide-react";
import type { TransparencyBalance } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface BalanceCardsProps {
  balance: TransparencyBalance | null;
  loading: boolean;
}

export function BalanceCards({ balance, loading }: BalanceCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      {/* Saldo RW */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
            Saldo Kas RW
          </CardTitle>
          <Wallet className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-40" />
          ) : balance?.rw ? (
            <>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {formatRupiah(balance.rw.balance)}
              </div>
              <p className="text-xs text-slate-500 mt-1">{balance.rw.groupName}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Data tidak tersedia</p>
          )}
        </CardContent>
      </Card>

      {/* Saldo RT */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
            Saldo Kas RT
          </CardTitle>
          <Wallet className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-40" />
          ) : balance?.rt ? (
            <>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">
                {formatRupiah(balance.rt.balance)}
              </div>
              <p className="text-xs text-slate-500 mt-1">{balance.rt.groupName}</p>
            </>
          ) : (
            <p className="text-sm text-slate-400">Data tidak tersedia</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
