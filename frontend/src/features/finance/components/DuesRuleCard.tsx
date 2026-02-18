import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { CalendarDays, Banknote, AlertCircle } from "lucide-react";
import type { GroupDuesInfo } from "@/features/finance/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface DuesRuleCardProps {
  info: GroupDuesInfo;
  highlight?: boolean;
}

export function DuesRuleCard({ info, highlight = false }: DuesRuleCardProps) {
  const { group, duesRule } = info;

  return (
    <Card className={highlight ? "border-primary/30 bg-primary/5" : ""}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-slate-700 font-poppins">
          {group.name}
        </CardTitle>
        <Badge
          variant={duesRule?.isActive ? "default" : "secondary"}
          className="text-xs"
        >
          {group.type}
        </Badge>
      </CardHeader>
      <CardContent>
        {duesRule ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" />
              <span className="text-sm text-slate-600">Nominal:</span>
              <span className="text-sm font-semibold text-slate-900">
                {formatRupiah(duesRule.amount)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm text-slate-600">Jatuh tempo:</span>
              <span className="text-sm font-semibold text-slate-900">
                Tanggal {duesRule.dueDay} setiap bulan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">
                Terakhir diperbarui:{" "}
                {new Date(duesRule.updatedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Belum ada aturan iuran yang dikonfigurasi.</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
