import { Link } from "react-router-dom";
import { Card, CardContent } from "@/shared/ui/card";
import { Building2, CalendarDays, Wallet, Clock } from "lucide-react";

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
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="flex items-center gap-3 py-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${link.iconBg}`}>
                {link.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{link.title}</p>
                <p className="text-[11px] text-slate-500">{link.description}</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
