import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  UserCircle,
  Building2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import type { TransactionDetail } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<TransactionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await financeService.getTransactionDetail(Number(id));
      setDetail(data);
    } catch {
      toast.error("Gagal memuat detail transaksi.");
    } finally {
      setLoading(false);
    }
  };

  const isIncome =
    detail?.type === "INCOME" || detail?.type === "CREDIT";

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
            Detail Transaksi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? "Memuat..." : `#${detail?.id || ""}`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-6 space-y-4">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </CardContent>
          </Card>
        </div>
      ) : !detail ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Receipt className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              Transaksi tidak ditemukan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Amount Card */}
          <Card
            className={`border-l-4 ${
              isIncome ? "border-l-emerald-500" : "border-l-red-500"
            }`}
          >
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <div
                  className={`h-14 w-14 rounded-xl flex items-center justify-center ${
                    isIncome ? "bg-emerald-100" : "bg-red-100"
                  }`}
                >
                  {isIncome ? (
                    <ArrowDownLeft className="h-7 w-7 text-emerald-600" />
                  ) : (
                    <ArrowUpRight className="h-7 w-7 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500">
                    {isIncome ? "Pemasukan" : "Pengeluaran"}
                  </p>
                  <p
                    className={`text-3xl sm:text-4xl font-bold ${
                      isIncome ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatRupiah(Math.abs(detail.amount))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold font-poppins">
                Informasi Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div className="flex items-start gap-3">
                <Receipt className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Deskripsi</p>
                  <p className="text-sm font-medium text-slate-900">
                    {detail.description}
                  </p>
                </div>
              </div>

              {/* Type */}
              <div className="flex items-start gap-3">
                <div className="h-4 w-4 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Tipe</p>
                  <Badge
                    variant={isIncome ? "default" : "destructive"}
                    className="mt-0.5"
                  >
                    {detail.type}
                  </Badge>
                </div>
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <CalendarDays className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Tanggal</p>
                  <p className="text-sm font-medium text-slate-900">
                    {formatDateTime(detail.createdAt)}
                  </p>
                </div>
              </div>

              {/* Group */}
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400">Grup</p>
                  <p className="text-sm font-medium text-slate-900">
                    {detail.wallet.communityGroup.name}
                  </p>
                </div>
              </div>

              {/* Created By */}
              {detail.createdBy && (
                <div className="flex items-start gap-3">
                  <UserCircle className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Dibuat oleh</p>
                    <p className="text-sm font-medium text-slate-900">
                      {detail.createdBy.fullName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {detail.createdBy.email}
                    </p>
                  </div>
                </div>
              )}

              {/* Event */}
              {detail.event && (
                <div className="flex items-start gap-3">
                  <CalendarDays className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400">Kegiatan Terkait</p>
                    <p className="text-sm font-medium text-slate-900">
                      {detail.event.title}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contribution Card (if applicable) */}
          {detail.contribution && (
            <Card className="border-blue-100 bg-blue-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold font-poppins text-blue-900">
                  Detail Iuran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-blue-500">Pembayar</p>
                  <p className="text-sm font-medium text-blue-900">
                    {detail.contribution.user.fullName}
                  </p>
                  <p className="text-xs text-blue-600">
                    {detail.contribution.user.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-500">Periode</p>
                  <p className="text-sm font-medium text-blue-900">
                    {MONTH_NAMES[detail.contribution.month - 1]}{" "}
                    {detail.contribution.year}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
