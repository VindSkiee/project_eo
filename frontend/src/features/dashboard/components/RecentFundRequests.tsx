import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Banknote, ArrowRight } from "lucide-react";
import type { FundRequest } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface RecentFundRequestsProps {
  fundRequests: FundRequest[];
  loading: boolean;
}

export function RecentFundRequests({ fundRequests, loading }: RecentFundRequestsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 font-poppins">
            Pengajuan Dana Terbaru
          </CardTitle>
          <CardDescription className="text-xs">5 pengajuan terakhir</CardDescription>
        </div>
        <Link to="/dashboard/kas">
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary text-xs">
            Semua <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : fundRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Banknote className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Belum ada pengajuan dana.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {fundRequests.slice(0, 5).map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <div className="h-9 w-9 rounded-lg bg-brand-green/10 flex items-center justify-center shrink-0">
                  <Banknote className="h-4 w-4 text-brand-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {formatRupiah(req.amount)}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {req.description} · {req.communityGroup?.name || "—"}
                  </p>
                </div>
                <Badge
                  variant={
                    req.status === "APPROVED"
                      ? "default"
                      : req.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-[10px] shrink-0"
                >
                  {req.status === "PENDING"
                    ? "Menunggu"
                    : req.status === "APPROVED"
                    ? "Disetujui"
                    : "Ditolak"}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
