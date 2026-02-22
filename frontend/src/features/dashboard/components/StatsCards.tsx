import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Users, Building2, Wallet, CalendarDays } from "lucide-react";
import type { WalletDetail } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface StatsCardsProps {
  usersCount: number;
  rtCount: number;
  wallet: WalletDetail | null;
  activeEventsCount: number;
  loading: boolean;
}

export function StatsCards({ usersCount, rtCount, wallet, activeEventsCount, loading }: StatsCardsProps) {
  const items = [
    {
      title: "Total Warga",
      icon: <Users className="h-4 w-4" />,
      iconBg: "bg-primary/10 text-primary",
      value: usersCount,
      description: "Terdaftar dalam sistem",
      skeletonWidth: "w-16",
    },
    {
      title: "Total RT",
      icon: <Building2 className="h-4 w-4" />,
      iconBg: "bg-blue-100 text-blue-600",
      value: rtCount,
      description: "RT aktif",
      skeletonWidth: "w-12",
    },
    {
      title: "Kas RW",
      icon: <Wallet className="h-4 w-4" />,
      iconBg: "bg-emerald-100 text-emerald-600",
      value: wallet ? formatRupiah(wallet.balance) : "Rp 0",
      description: wallet?.communityGroup?.name || "Saldo kas",
      descriptionClass: "text-brand-green font-medium",
      skeletonWidth: "w-28",
    },
    {
      title: "Kegiatan Aktif",
      icon: <CalendarDays className="h-4 w-4" />,
      iconBg: "bg-amber-100 text-amber-600",
      value: activeEventsCount,
      description: "Sedang berjalan",
      skeletonWidth: "w-12",
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.title} className="hover:shadow-sm transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              {item.title}
            </CardTitle>
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${item.iconBg}`}>
              {item.icon}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className={`h-8 ${item.skeletonWidth}`} />
            ) : (
              <>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">
                  {item.value}
                </div>
                <p className={`text-[11px] sm:text-xs mt-1 ${item.descriptionClass || "text-slate-500"}`}>
                  {item.description}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
