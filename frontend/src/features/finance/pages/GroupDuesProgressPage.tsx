import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import {
  ArrowLeft,
  Search,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import type { DuesProgressData, DuesProgressMember } from "@/shared/types";

// === HELPERS ===

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTH_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Check if a member has paid for a specific month safely */
function isPaidForMonth(member: DuesProgressMember, month: number, year: number): boolean {
  // 1. Safe check for explicit contributions (Fallback to empty array if undefined)
  const safeContributions = member.contributions || [];
  const hasContribution = safeContributions.some(
    (c) => c.month === month && c.year === year
  );
  if (hasContribution) return true;

  // 2. Fallback check for lastPaidPeriod using robust Year/Month comparison
  if (member.lastPaidPeriod) {
    const lp = new Date(member.lastPaidPeriod);
    const lpYear = lp.getFullYear();
    const lpMonth = lp.getMonth() + 1; // 1-based

    // Jika tahun kalender lebih kecil dari tahun lastPaid, berarti sudah lunas
    if (year < lpYear) return true;
    // Jika tahunnya sama, pastikan bulan kalender <= bulan lastPaid
    if (year === lpYear && month <= lpMonth) return true;
  }

  return false;
}

/** Check if member existed in a given month cleanly via strict Year/Month */
function memberExistedInMonth(member: DuesProgressMember, month: number, year: number): boolean {
  if (!member.createdAt) return true; // Safety fallback untuk data lama
  
  const created = new Date(member.createdAt);
  const cYear = created.getFullYear();
  const cMonth = created.getMonth() + 1;
  
  if (year > cYear) return true;
  if (year === cYear && month >= cMonth) return true;
  
  return false;
}

type FilterMode = "all" | "lunas" | "belum";

export default function GroupDuesProgressPage() {
  const { groupId: paramGroupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<DuesProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const currentMonth = new Date().getMonth() + 1; // 1-based
  const currentYear = new Date().getFullYear();

  // Resolve effective group ID
  const resolvedGroupId = (() => {
    const fromParam = Number(paramGroupId);
    if (!isNaN(fromParam) && fromParam > 0) return fromParam;
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        if (user.communityGroupId) return Number(user.communityGroupId);
      }
    } catch { /* ignore */ }
    return null;
  })();

  useEffect(() => {
    if (resolvedGroupId) fetchData();
  }, [resolvedGroupId, selectedYear]);

  const fetchData = async () => {
    if (!resolvedGroupId) return;
    setLoading(true);
    try {
      const res = await financeService.getDuesProgress(resolvedGroupId, selectedYear);
      setData(res);
    } catch {
      toast.error("Gagal memuat data progres iuran.");
    } finally {
      setLoading(false);
    }
  };

  /** Is the member fully paid for all applicable months up to current */
  const isFullyPaid = useCallback((member: DuesProgressMember): boolean => {
    // Determine max month to check. If looking at future year, default to checking up to month 12
    // but future months will be ignored anyway by 'memberExistedInMonth' or skipped logically.
    const maxMonth = selectedYear >= currentYear ? currentMonth : 12;

    for (let m = 1; m <= maxMonth; m++) {
      if (memberExistedInMonth(member, m, selectedYear)) {
        if (!isPaidForMonth(member, m, selectedYear)) {
          return false;
        }
      }
    }
    return true;
  }, [selectedYear, currentYear, currentMonth]);

  const filteredMembers = useMemo(() => {
    if (!data?.members) return [];
    let members = data.members;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      members = members.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          (m.phone || "").toLowerCase().includes(q)
      );
    }

    // Status filter
    if (filter === "lunas") {
      members = members.filter((m) => isFullyPaid(m));
    } else if (filter === "belum") {
      members = members.filter((m) => !isFullyPaid(m));
    }

    return members;
  }, [data, search, filter, isFullyPaid]);

  // Statistics
  const totalMembers = data?.members?.length || 0;
  const paidCount = data?.members?.filter((m) => isFullyPaid(m)).length || 0;
  const unpaidCount = totalMembers - paidCount;

  // Year options (last 3 years)
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 mt-0.5">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold font-poppins text-slate-900 truncate">
              Progres Iuran {data?.group.name || ""}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Pantau progres pembayaran iuran bulanan warga.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">Total Warga</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-12" /> : (
                <div className="text-2xl font-bold text-slate-900">{totalMembers}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">Lunas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-12" /> : (
                <div className="text-2xl font-bold text-emerald-600">{paidCount}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">Belum Lunas</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {loading ? <Skeleton className="h-8 w-12" /> : (
                <div className="text-2xl font-bold text-red-600">{unpaidCount}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Dues Rule Info */}
        {data?.duesRule && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center gap-3 py-3">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm text-slate-700">
                Iuran: <span className="font-semibold">{formatRupiah(Number(data.duesRule.amount))}</span>/bulan
                {data.parentDuesRule && (
                  <> · Iuran RW: <span className="font-semibold">{formatRupiah(Number(data.parentDuesRule.amount))}</span>/bulan</>
                )}
                {data.duesRule.dueDay && (
                  <> · Jatuh tempo tanggal <span className="font-semibold">{data.duesRule.dueDay}</span></>
                )}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari nama atau telepon..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterMode)}>
              <SelectTrigger className="w-[140px] h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="lunas">Lunas</SelectItem>
                <SelectItem value="belum">Belum Lunas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger className="w-[100px] h-10">
                <Calendar className="h-4 w-4 mr-1.5 text-slate-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress Table */}
        {loading ? (
          <Card>
            <CardContent className="py-6 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : filteredMembers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500 font-medium">
                {search || filter !== "all" ? "Tidak ada warga yang cocok." : "Belum ada data warga."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="text-left py-3 px-4 font-semibold text-slate-600 w-10">#</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600 min-w-[140px]">Nama</th>
                    <th className="text-left py-3 px-4 font-semibold text-slate-600 hidden sm:table-cell min-w-[120px]">No. HP</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-600" colSpan={12}>
                      Progres Bulanan {selectedYear}
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-600 w-20">Status</th>
                  </tr>
                  {/* Month headers */}
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th colSpan={3} className="hidden sm:table-cell" />
                    <th colSpan={2} className="sm:hidden" />
                    {MONTH_NAMES.map((name, idx) => {
                      const monthNum = idx + 1;
                      const isCurrent = selectedYear === currentYear && monthNum === currentMonth;
                      return (
                        <th
                          key={name}
                          className={`text-center py-1.5 px-0.5 text-[10px] sm:text-xs font-medium ${
                            isCurrent ? "text-primary font-bold" : "text-slate-500"
                          }`}
                        >
                          {name}
                          {isCurrent && (
                            <div className="h-0.5 w-full bg-primary rounded-full mt-0.5" />
                          )}
                        </th>
                      );
                    })}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member, idx) => (
                    <MemberRow
                      key={member.id}
                      member={member}
                      index={idx + 1}
                      year={selectedYear}
                      currentMonth={currentMonth}
                      currentYear={currentYear}
                      isFullyPaid={isFullyPaid(member)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-500" />
            <span>Lunas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-red-400" />
            <span>Belum Bayar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-200" />
            <span>Belum Terdaftar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1 rounded-full bg-primary" />
            <span>Bulan Ini</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// === MEMBER ROW COMPONENT ===

function MemberRow({
  member,
  index,
  year,
  currentMonth,
  currentYear,
  isFullyPaid: fullyPaid,
}: {
  member: DuesProgressMember;
  index: number;
  year: number;
  currentMonth: number;
  currentYear: number;
  isFullyPaid: boolean;
}) {
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
      <td className="py-3 px-4 text-slate-400 text-xs">{index}</td>
      <td className="py-3 px-4">
        <div className="min-w-0">
          <p className="font-medium text-slate-900 text-sm truncate">{member.fullName}</p>
          <p className="text-xs text-slate-400 sm:hidden">{member.phone || "—"}</p>
        </div>
      </td>
      <td className="py-3 px-4 text-slate-600 hidden sm:table-cell">
        {member.phone || "—"}
      </td>
      
      {/* 12 Month blocks */}
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const existed = memberExistedInMonth(member, month, year);
        const paid = existed && isPaidForMonth(member, month, year);
        const isCurrent = year === currentYear && month === currentMonth;
        
        // Cek aman untuk list contribution manual dari backend
        const safeContributions = member.contributions || [];
        const contribution = safeContributions.find(
          (c) => c.month === month && c.year === year
        );

        let bgColor = "bg-slate-200"; // Default: Belum terdaftar
        let tooltipText = `${MONTH_FULL[month - 1]} — Belum terdaftar`;

        const isStrictlyFuture = year > currentYear || (year === currentYear && month > currentMonth);

        if (existed) {
          if (paid) {
            bgColor = "bg-emerald-500";
            tooltipText = `${MONTH_FULL[month - 1]} — Lunas`;
            if (contribution) {
              tooltipText += ` (${new Date(contribution.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})`;
            }
          } else if (isStrictlyFuture) {
            bgColor = "bg-slate-300/50";
            tooltipText = `${MONTH_FULL[month - 1]} — Belum jatuh tempo`;
          } else {
            bgColor = "bg-red-400";
            tooltipText = `${MONTH_FULL[month - 1]} — Belum bayar`;
          }
        }

        return (
          <td key={month} className="py-3 px-0.5 text-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`
                    w-5 h-5 sm:w-6 sm:h-6 rounded mx-auto cursor-default transition-transform hover:scale-110
                    ${bgColor}
                    ${isCurrent ? "ring-2 ring-primary ring-offset-1" : ""}
                  `}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {tooltipText}
              </TooltipContent>
            </Tooltip>
          </td>
        );
      })}
      
      {/* Status badge */}
      <td className="py-3 px-4 text-center">
        <Badge
          variant={fullyPaid ? "default" : "destructive"}
          className={`text-[10px] sm:text-xs ${fullyPaid ? "bg-emerald-500 hover:bg-emerald-600" : ""}`}
        >
          {fullyPaid ? "Lunas" : "Belum"}
        </Badge>
      </td>
    </tr>
  );
}