import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Building2, Users, ChevronRight, UserCircle } from "lucide-react";
import type { ChildWalletInfo } from "@/shared/types";

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

interface ChildrenWalletsSectionProps {
  wallets: ChildWalletInfo[];
  loading: boolean;
  /** Base path for navigating to RT finance detail, e.g. "/dashboard/keuangan-rt" */
  basePath: string;
}

export function ChildrenWalletsSection({
  wallets: childWallets,
  loading,
  basePath,
}: ChildrenWalletsSectionProps) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-800 font-poppins">
          Saldo Kas RT
        </h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="py-6">
                <Skeleton className="h-6 w-32 mb-3" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (childWallets.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-10 text-center">
          <Building2 className="h-10 w-10 text-slate-300 mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            Belum ada data RT.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-800 font-poppins">
        Saldo Kas RT
      </h2>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {childWallets.map((child) => (
          <Card
            key={child.group.id}
            className="cursor-pointer hover:shadow-md transition-shadow duration-200 group"
            onClick={() => navigate(`${basePath}/${child.group.id}`)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-slate-900 font-poppins">
                  {child.group.name}
                </CardTitle>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Balance */}
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatRupiah(child.balance)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {child.walletUpdatedAt
                    ? `Diperbarui ${formatDate(child.walletUpdatedAt)}`
                    : "Belum ada transaksi"}
                </p>
              </div>

              {/* Officers */}
              <div className="flex flex-col gap-1.5">
                {child.admin && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <UserCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">
                      <span className="text-slate-400">Ketua:</span>{" "}
                      {child.admin.fullName}
                    </span>
                  </div>
                )}
                {child.treasurer && (
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <UserCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">
                      <span className="text-slate-400">Bendahara:</span>{" "}
                      {child.treasurer.fullName}
                    </span>
                  </div>
                )}
              </div>

              {/* Footer Row */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="h-3.5 w-3.5" />
                  <span>{child.memberCount} warga</span>
                </div>
                {child.duesRule ? (
                  <Badge variant="default" className="text-[10px]">
                    Iuran {formatRupiah(child.duesRule.amount)}
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px]">
                    Belum diatur
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
