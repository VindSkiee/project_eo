import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { Users, Wallet, Building2 } from "lucide-react";
import type { DuesProgressMember } from "@/shared/types";
import { useNavigate } from "react-router-dom";

// === TYPES ===
export interface GroupProgressSummary {
  id: number;
  name: string;
  adminName: string;
  treasurerName: string;
  balance: number;
  monthlyStatus: Array<"PAID" | "PARTIAL" | "UNPAID" | "FUTURE" | "NOT_REGISTERED">;
  isFullyPaid: boolean;
}

interface DuesProgressTableProps {
  isParentLevel: boolean;
  loading: boolean;
  selectedYear: number;
  currentMonth: number;
  currentYear: number;
  parentData: GroupProgressSummary[];
  childData: DuesProgressMember[];
  isFullyPaidChild: (member: DuesProgressMember) => boolean;
}

// === CONSTANTS & HELPERS ===
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
export const MONTH_FULL = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function isPaidForMonth(member: DuesProgressMember, month: number, year: number): boolean {
  const safeContributions = member.contributions || [];
  const hasContribution = safeContributions.some((c) => c.month === month && c.year === year);
  if (hasContribution) return true;

  if (member.lastPaidPeriod) {
    const lp = new Date(member.lastPaidPeriod);
    const lpYear = lp.getFullYear();
    const lpMonth = lp.getMonth() + 1;
    if (year < lpYear) return true;
    if (year === lpYear && month <= lpMonth) return true;
  }
  return false;
}

export function memberExistedInMonth(member: DuesProgressMember, month: number, year: number): boolean {
  if (!member.createdAt) return true;
  const created = new Date(member.createdAt);
  const cYear = created.getFullYear();
  const cMonth = created.getMonth() + 1;
  if (year > cYear) return true;
  if (year === cYear && month >= cMonth) return true;
  return false;
}

// === MAIN COMPONENT ===
export function DuesProgressTable({
  isParentLevel,
  loading,
  selectedYear,
  currentMonth,
  currentYear,
  parentData,
  childData,
  isFullyPaidChild,
}: DuesProgressTableProps) {
  
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (isParentLevel) {
    if (parentData.length === 0) return <EmptyState message="Tidak ada lingkungan (RT) yang cocok dengan filter." icon={Building2} />;
    
    return (
      <Card className="overflow-hidden border-0 ring-1 ring-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="text-center py-4 px-4 font-semibold text-slate-700 w-10">No</th>
                <th className="text-center py-4 px-4 font-semibold text-slate-700 min-w-[200px]">Lingkungan</th>
                <th className="text-center py-4 px-2 font-semibold text-slate-700" colSpan={12}>Progres Kolektif {selectedYear}</th>
                <th className="text-center py-4 px-4 font-semibold text-slate-700 w-24">Status</th>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th colSpan={2} />
                {MONTH_NAMES.map((name, idx) => (
                  <th key={name} className={`text-center py-2 px-1 text-[10px] sm:text-xs font-medium ${selectedYear === currentYear && (idx + 1) === currentMonth ? "text-primary font-bold" : "text-slate-500"}`}>
                    {name}
                    {selectedYear === currentYear && (idx + 1) === currentMonth && <div className="h-0.5 w-full bg-primary rounded-full mt-1" />}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {parentData.map((group, idx) => (
                <ParentRow key={group.id} group={group} index={idx + 1} />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  // CHILD LEVEL (RT)
  if (childData.length === 0) return <EmptyState message="Tidak ada warga yang cocok dengan filter." icon={Users} />;

  return (
    <Card className="overflow-hidden border-0 ring-1 ring-slate-200 shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-center py-4 px-4 font-semibold text-slate-700 w-10">No</th>
              <th className="text-center py-4 px-4 font-semibold text-slate-700 min-w-[160px]">Nama Warga</th>
              <th className="text-center py-4 px-4 font-semibold text-slate-700 hidden sm:table-cell min-w-[120px]">No. HP</th>
              <th className="text-center py-4 px-2 font-semibold text-slate-700" colSpan={12}>Progres Bulanan {selectedYear}</th>
              <th className="text-center py-4 px-4 font-semibold text-slate-700 w-24">Status</th>
            </tr>
            <tr className="border-b border-slate-200 bg-slate-50/50">
              <th colSpan={3} className="hidden sm:table-cell" /><th colSpan={2} className="sm:hidden" />
              {MONTH_NAMES.map((name, idx) => (
                <th key={name} className={`text-center py-2 px-1 text-[10px] sm:text-xs font-medium ${selectedYear === currentYear && (idx + 1) === currentMonth ? "text-primary font-bold" : "text-slate-500"}`}>
                  {name}
                  {selectedYear === currentYear && (idx + 1) === currentMonth && <div className="h-0.5 w-full bg-primary rounded-full mt-1" />}
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {childData.map((member, idx) => (
              <ChildRow 
                key={member.id} 
                member={member} 
                index={idx + 1} 
                year={selectedYear} 
                currentMonth={currentMonth} 
                currentYear={currentYear} 
                isFullyPaid={isFullyPaidChild(member)} 
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// === ROW COMPONENTS ===

function ParentRow({ group, index }: { group: GroupProgressSummary; index: number }) {
  const navigate = useNavigate();

  // Ambil role dari localStorage dengan aman
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role: string = user.role || "";
  
  // 👇 PASTIKAN PATH INI SAMA PERSIS DENGAN APP.TSX 👇
  const targetPath = role === "TREASURER"
    ? `/dashboard/progres-iuran-bendahara/${group.id}`
    : `/dashboard/progres-iuran/${group.id}`;

  return (
    <tr 
      onClick={() => navigate(targetPath)} // <--- UBAH DI SINI
      className="hover:bg-slate-100 transition-colors group cursor-pointer"
    >
      <td className="py-4 px-4 text-slate-400 text-sm">{index}</td>
      <td className="py-4 px-4">
        <div className="min-w-0">
          {/* Ubah warna text saat di-hover agar user tahu ini bisa diklik */}
          <p className="font-bold text-slate-900 text-sm group-hover:text-primary transition-colors">
            {group.name}
          </p>
          <div className="flex flex-col gap-0.5 mt-1 text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Admin: {group.adminName}</span>
            <span className="flex items-center gap-1"><Wallet className="h-3 w-3 text-emerald-600" /> Kas: <span className="font-semibold text-slate-700">{formatRupiah(group.balance)}</span></span>
          </div>
        </div>
      </td>
      {group.monthlyStatus.map((status, idx) => {
        let bgColor = "bg-slate-100";
        let tooltipText = `${MONTH_FULL[idx]} — Belum Jatuh Tempo`;

        if (status === "PAID") { bgColor = "bg-emerald-500"; tooltipText = `${MONTH_FULL[idx]} — 100% Terkumpul`; }
        else if (status === "PARTIAL") { bgColor = "bg-amber-400"; tooltipText = `${MONTH_FULL[idx]} — Terkumpul Sebagian`; }
        else if (status === "UNPAID") { bgColor = "bg-red-400"; tooltipText = `${MONTH_FULL[idx]} — Nihil / Kosong`; }

        return (
          <td key={idx} className="py-4 px-1 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded mx-auto cursor-default transition-transform hover:scale-110 shadow-sm ${bgColor}`} />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">{tooltipText}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </td>
        );
      })}
      <td className="py-4 px-4 text-center">
        <Badge variant={group.isFullyPaid ? "default" : "secondary"} className={`text-[10px] ${group.isFullyPaid ? "bg-emerald-500" : "bg-amber-100 text-amber-700"}`}>
          {group.isFullyPaid ? "Lunas" : "Ada Tunggakan"}
        </Badge>
      </td>
    </tr>
  );
}

function ChildRow({ member, index, year, currentMonth, currentYear, isFullyPaid }: any) {
  return (
    <tr className="hover:bg-slate-50/80 transition-colors group">
      <td className="py-4 px-4 text-slate-400 text-sm">{index}</td>
      <td className="py-4 px-4">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 text-sm truncate">{member.fullName}</p>
          <p className="text-xs text-slate-400 sm:hidden mt-0.5">{member.phone || "—"}</p>
        </div>
      </td>
      <td className="py-4 px-4 text-slate-500 text-xs hidden sm:table-cell">{member.phone || "—"}</td>
      
      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
        const existed = memberExistedInMonth(member, month, year);
        const paid = existed && isPaidForMonth(member, month, year);
        const isCurrent = year === currentYear && month === currentMonth;
        const isStrictlyFuture = year > currentYear || (year === currentYear && month > currentMonth);
        const contribution = (member.contributions || []).find((c:any) => c.month === month && c.year === year);

        let bgColor = "bg-slate-200 border border-slate-300/50"; 
        let tooltipText = `${MONTH_FULL[month - 1]} — Belum terdaftar`;

        if (existed) {
          if (paid) {
            bgColor = "bg-emerald-500 shadow-sm ring-1 ring-emerald-600/20";
            tooltipText = `${MONTH_FULL[month - 1]} — Lunas`;
            if (contribution) tooltipText += ` (${new Date(contribution.paidAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})`;
          } else if (isStrictlyFuture) {
            bgColor = "bg-slate-100";
            tooltipText = `${MONTH_FULL[month - 1]} — Belum jatuh tempo`;
          } else {
            bgColor = "bg-red-400 shadow-sm ring-1 ring-red-500/20";
            tooltipText = `${MONTH_FULL[month - 1]} — Menunggak`;
          }
        }

        return (
          <td key={month} className="py-4 px-1 text-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded mx-auto cursor-default transition-transform hover:scale-110 ${bgColor} ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`} />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs font-medium">{tooltipText}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </td>
        );
      })}
      <td className="py-4 px-4 text-center">
        <Badge variant={isFullyPaid ? "default" : "destructive"} className={`text-[10px] ${isFullyPaid ? "bg-emerald-500" : ""}`}>
          {isFullyPaid ? "Lunas" : "Tunggakan"}
        </Badge>
      </td>
    </tr>
  );
}

function EmptyState({ message, icon: Icon }: { message: string, icon: any }) {
  return (
    <Card className="border-dashed shadow-none bg-slate-50/50">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center mb-4 ring-1 ring-slate-100 shadow-sm">
          <Icon className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-sm text-slate-500 font-medium">{message}</p>
      </CardContent>
    </Card>
  );
}