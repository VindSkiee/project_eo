import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { CreditCard, CheckCircle2, Clock, Receipt } from "lucide-react";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface PaymentSummaryCardsProps {
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  totalPaid: number;
  loading: boolean;
}

export function PaymentSummaryCards({
  totalCount,
  paidCount,
  pendingCount,
  totalPaid,
  loading,
}: PaymentSummaryCardsProps) {
  const cards = [
    {
      title: "Total Transaksi",
      icon: CreditCard,
      iconClass: "text-primary",
      value: totalCount,
      valueClass: "text-slate-900",
    },
    {
      title: "Berhasil",
      icon: CheckCircle2,
      iconClass: "text-emerald-500",
      value: paidCount,
      valueClass: "text-emerald-600",
    },
    {
      title: "Menunggu",
      icon: Clock,
      iconClass: "text-amber-500",
      value: pendingCount,
      valueClass: "text-amber-600",
    },
    {
      title: "Total Dibayar",
      icon: Receipt,
      iconClass: "text-brand-green",
      value: formatRupiah(totalPaid),
      valueClass: "text-brand-green",
      largeSkeleton: true,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.iconClass}`} />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className={card.largeSkeleton ? "h-8 w-28" : "h-8 w-12"} />
              ) : (
                <div className={`${card.largeSkeleton ? "text-xl sm:text-2xl" : "text-2xl"} font-bold ${card.valueClass}`}>
                  {card.value}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
