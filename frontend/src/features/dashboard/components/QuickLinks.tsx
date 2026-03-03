import { Link } from "react-router-dom";
import { Card, CardContent } from "@/shared/ui/card";
import { Building2, CalendarDays, Wallet, Clock, ArrowRight, type LucideIcon } from "lucide-react";

const defaultLinks: QuickLink[] = [
  {
    to: "/dashboard/organisasi",
    icon: Building2,
    iconColor: "text-primary",
    iconBg: "bg-primary/10 group-hover:bg-primary/20",
    title: "Organisasi",
    description: "Kelola RT & Warga",
  },
  {
    to: "/dashboard/kegiatan",
    icon: CalendarDays,
    iconColor: "text-primary",
    iconBg: "bg-primary/10 group-hover:bg-primary/20",
    title: "Kegiatan",
    description: "Event & Acara",
  },
  {
    to: "/dashboard/kas",
    icon: Wallet,
    iconColor: "text-brand-green",
    iconBg: "bg-brand-green/10 group-hover:bg-brand-green/20",
    title: "Keuangan",
    description: "Kas & Transaksi",
  },
  {
    to: "/dashboard/pembayaran",
    icon: Clock,
    iconColor: "text-primary",
    iconBg: "bg-primary/10 group-hover:bg-primary/20",
    title: "Pembayaran",
    description: "Riwayat Bayar",
  },
];

export type QuickLink = {
  to: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
};

interface QuickLinksProps {
  items?: QuickLink[];
  gridClassName?: string;
}

export function QuickLinks({
  items = defaultLinks,
  gridClassName = "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4",
}: QuickLinksProps) {
  return (
    <div className={gridClassName}>
      {items.map((link) => {
        const Icon = link.icon;

        return (
          <Link key={link.to} to={link.to} className="outline-none">
            <Card className="h-full border-0 ring-1 ring-slate-100 shadow-sm hover:ring-primary/30 hover:shadow-md transition-all duration-300 cursor-pointer group rounded-2xl bg-white">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-4 sm:p-5">
                <div
                  className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-300 ${link.iconBg}`}
                >
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${link.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0 w-full">
                  <p className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-primary transition-colors truncate">
                    {link.title}
                  </p>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                    {link.description}
                  </p>
                </div>

                <ArrowRight className="h-4 w-4 text-slate-300 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-primary transition-all duration-300 shrink-0 hidden lg:block" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
