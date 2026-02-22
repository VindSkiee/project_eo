import { Link } from "react-router-dom";
import { Card, CardContent } from "@/shared/ui/card";
import { Building2, CalendarDays, Wallet, Clock, ArrowRight } from "lucide-react";

const links = [
  {
    to: "/dashboard/organisasi",
    icon: <Building2 className="h-5 w-5 text-primary" />,
    iconBg: "bg-primary/10 group-hover:bg-primary/20",
    title: "Organisasi",
    description: "Kelola RT & Warga",
  },
  {
    to: "/dashboard/kegiatan",
    icon: <CalendarDays className="h-5 w-5 text-primary" />,
    iconBg: "bg-primary/10 group-hover:bg-primary/20",
    title: "Kegiatan",
    description: "Event & Acara",
  },
  {
    to: "/dashboard/kas",
    icon: <Wallet className="h-5 w-5 text-brand-green" />,
    iconBg: "bg-brand-green/10 group-hover:bg-brand-green/20",
    title: "Keuangan",
    description: "Kas & Transaksi",
  },
  {
    to: "/dashboard/pembayaran",
    icon: <Clock className="h-5 w-5 text-primary" />,
    iconBg: "bg-primary/10 group-hover:bg-primary/20",
    title: "Pembayaran",
    description: "Riwayat Bayar",
  },
];

export function QuickLinks() {
  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
      {links.map((link) => (
        <Link key={link.to} to={link.to}>
          <Card className="hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${link.iconBg}`}>
                {link.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 group-hover:text-slate-900 truncate">{link.title}</p>
                <p className="text-[11px] text-slate-500 truncate hidden sm:block">{link.description}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0 hidden sm:block" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
