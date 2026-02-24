import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Banknote, ArrowRight, ArrowDownToLine } from "lucide-react";
import type { FundRequest } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// === HELPER UNTUK BADGE STYLE ===
function getStatusBadgeProps(status: string) {
  switch (status) {
    case "APPROVED":
      return { label: "Disetujui", className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "PENDING":
      return { label: "Menunggu", className: "bg-amber-50 text-amber-700 border-amber-200" };
    case "REJECTED":
      return { label: "Ditolak", className: "bg-red-50 text-red-700 border-red-200" };
    default:
      return { label: status, className: "bg-slate-50 text-slate-600 border-slate-200" };
  }
}

interface RecentFundRequestsProps {
  fundRequests: FundRequest[];
  loading: boolean;
}

export function RecentFundRequests({ fundRequests, loading }: RecentFundRequestsProps) {
  return (
    <Card className="flex flex-col border-0 ring-1 ring-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] rounded-2xl overflow-hidden h-full">
      {/* HEADER: Seragam dengan RecentEvents */}
      <CardHeader className="flex flex-row items-center justify-between pb-4 pt-5 px-6 border-b border-slate-50/80 bg-white">
        <div>
          <CardTitle className="text-base font-semibold text-slate-900 font-poppins flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-emerald-600" />
            Pengajuan Dana
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-1">
            Menampilkan 5 pengajuan terakhir
          </CardDescription>
        </div>
        <Link 
          to="/dashboard/kas"
          className="group flex items-center text-[13px] font-medium text-slate-500 hover:text-emerald-600 transition-colors px-2 py-1"
        >
          Semua
          <ArrowRight className="h-3.5 w-3.5 ml-1 opacity-50 group-hover:translate-x-0.5 group-hover:opacity-100 transition-all" />
        </Link>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        {loading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-2">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0 bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4 bg-slate-100" />
                  <Skeleton className="h-2.5 w-1/2 bg-slate-100" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full shrink-0 bg-slate-100" />
              </div>
            ))}
          </div>
        ) : fundRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <Banknote className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-600">Belum ada pengajuan</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-[200px]">Data pengajuan dana akan muncul di sini saat ditambahkan.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {fundRequests.slice(0, 5).map((req) => {
              const statusStyle = getStatusBadgeProps(req.status);
              
              return (
                <div
                  key={req.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-all group"
                >
                  {/* ICON BOX: Seragam dengan Date Box di RecentEvents */}
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm shrink-0 group-hover:border-emerald-200 group-hover:bg-emerald-100/50 transition-colors">
                    <Banknote className="h-5 w-5" />
                  </div>
                  
                  {/* INFO TEXT */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 font-inter truncate group-hover:text-emerald-700 transition-colors">
                      {formatRupiah(req.amount)}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
                      {req.communityGroup?.name ? (
                        <>
                          <span className="font-medium text-slate-600">{req.communityGroup.name}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                          <span>{req.description}</span>
                        </>
                      ) : (
                        <span>{req.description}</span>
                      )}
                    </p>
                  </div>
                  
                  {/* STATUS BADGE */}
                  <Badge
                    variant="outline"
                    className={`text-[10px] px-2 py-0.5 font-medium shrink-0 shadow-none ${statusStyle.className}`}
                  >
                    {statusStyle.label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}