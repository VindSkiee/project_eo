import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import type { EventItem, FundRequest } from "@/shared/types";

interface ActionRequiredProps {
  pendingEvents: EventItem[];
  pendingFundRequests: FundRequest[];
  loading: boolean;
}

export function ActionRequired({ pendingEvents, pendingFundRequests, loading }: ActionRequiredProps) {
  const totalActionRequired = pendingEvents.length + pendingFundRequests.length;

  if (loading) return null;

  if (totalActionRequired === 0) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="flex items-center gap-3 py-4">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">
            Semua aman! Tidak ada pengajuan yang menunggu persetujuan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-base font-semibold text-amber-900 font-poppins">
            Perlu Tindakan ({totalActionRequired})
          </CardTitle>
        </div>
        <CardDescription className="text-amber-700/80">
          Ada pengajuan yang menunggu persetujuan Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingEvents.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {pendingEvents.length} Kegiatan Menunggu Persetujuan
                </p>
                <p className="text-xs text-slate-500">
                  Kegiatan baru dari RT perlu di-review
                </p>
              </div>
            </div>
            <Link to="/dashboard/kegiatan">
              <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
                Lihat <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}

        {pendingFundRequests.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-brand-green/10 flex items-center justify-center">
                <Banknote className="h-4 w-4 text-brand-green" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {pendingFundRequests.length} Pengajuan Dana Menunggu
                </p>
                <p className="text-xs text-slate-500">
                  Permintaan dana dari RT perlu di-review
                </p>
              </div>
            </div>
            <Link to="/dashboard/kas">
              <Button variant="ghost" size="sm" className="text-brand-green hover:text-brand-green">
                Lihat <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
