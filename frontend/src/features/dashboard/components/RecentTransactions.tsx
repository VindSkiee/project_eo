import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { ArrowDownLeft, ArrowUpRight, ArrowRight, Receipt } from "lucide-react";
import type { Transaction } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface RecentTransactionsProps {
  /** All transactions — component will filter to walletId */
  transactions: Transaction[];
  /** The wallet id belonging to the current user's group */
  walletId: number | null;
  loading: boolean;
  /** Link for "View All" button, e.g. "/dashboard/kas-bendahara" */
  viewAllLink: string;
  /** Max items to show, default 5 */
  limit?: number;
}

export function RecentTransactions({
  transactions,
  walletId,
  loading,
  viewAllLink,
  limit = 5,
}: RecentTransactionsProps) {
  // Filter to only show transactions from the user's own wallet/group
  const filtered = walletId
    ? transactions.filter((tx) => tx.walletId === walletId)
    : transactions;
  const items = filtered.slice(0, limit);

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 font-poppins">
            Transaksi Terakhir
          </CardTitle>
          <CardDescription className="text-xs">
            {limit} transaksi terakhir grup Anda
          </CardDescription>
        </div>
        <Link to={viewAllLink}>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary text-xs">
            Semua <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-4 w-20 shrink-0" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Receipt className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Belum ada transaksi.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((tx) => {
              const isIncome = tx.type === "CREDIT" || tx.type === "INCOME";
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isIncome ? "bg-emerald-100" : "bg-red-100"
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {tx.description}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(tx.createdAt)}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold shrink-0 tabular-nums ${
                      isIncome ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatRupiah(Math.abs(tx.amount))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
