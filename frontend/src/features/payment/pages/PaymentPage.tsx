import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import {
  Search,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  Info,
  Building2,
  ListFilter,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import { DateRangeFilter, type DateRange } from "@/shared/components/DateRangeFilter";
import type { DuesProgressData, DuesProgressMember } from "@/shared/types";

// Import Komponen Table yang sudah dipisah
import {
  DuesProgressTable,
  isPaidForMonth,
  memberExistedInMonth
} from "@/features/payment/components/DuesProgressTable"; 
import type { GroupProgressSummary } from "@/features/payment/components/DuesProgressTable";

interface ParentProgressData {
  group: { name: string; type: string; createdAt?: string };
  childGroups: GroupProgressSummary[];
}

type FilterMode = "all" | "lunas" | "belum";

export default function PaymentPage() {
  const { groupId: paramGroupId } = useParams<{ groupId?: string }>();
  const navigate = useNavigate();
  
  // States
  const [childData, setChildData] = useState<DuesProgressData | null>(null);
  const [parentData, setParentData] = useState<ParentProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine if this is parent level based on fetched data
  const isParentLevel = useMemo(() => {
    return parentData !== null;
  }, [parentData]);

  // Filters
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // 1. CARA FETCHING ID: Resolve effective group ID
  const resolvedGroupId = useMemo(() => {
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
  }, [paramGroupId]);

  // 2. EFFECT FETCH DATA PINTAR
  useEffect(() => {
    if (resolvedGroupId) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedGroupId, selectedYear]); 

  const fetchData = async () => {
    if (!resolvedGroupId) return;
    
    setLoading(true);
    try {
      // LANGKAH 1: Ambil data basic dulu
      const initialRes = await financeService.getDuesProgress(resolvedGroupId, selectedYear);
      
      // LANGKAH 2: Biarkan backend yang menentukan apakah ini RW atau RT
      if (initialRes.group.type === "RW") {
        const parentRes = await financeService.getParentDuesProgress(resolvedGroupId, selectedYear);
        setParentData(parentRes);
        setChildData(null); 
      } else {
        setChildData(initialRes);
        setParentData(null);
      }
    } catch (err) {
      console.error("Error Fetching Data:", err);
      toast.error("Gagal memuat data progres iuran.");
    } finally {
      setLoading(false);
    }
  };

  // === DYNAMIC YEAR LOGIC ===
  const yearOptions = useMemo(() => {
    const groupCreatedAt = isParentLevel ? (parentData?.group as any)?.createdAt : (childData?.group as any)?.createdAt;
    const startYear = groupCreatedAt ? new Date(groupCreatedAt).getFullYear() : currentYear;
    
    // Pastikan tidak ada array panjang negatif jika sistem backend mengembalikan tanggal masa depan secara keliru
    const length = Math.max(1, currentYear - startYear + 1);
    
    return Array.from({ length }, (_, i) => currentYear - i);
  }, [parentData, childData, currentYear, isParentLevel]);


  // === FILTERING LOGIC (CHILD/RT LEVEL) ===
  const isFullyPaidChild = useCallback((member: DuesProgressMember): boolean => {
    const maxMonth = selectedYear >= currentYear ? currentMonth : 12;
    for (let m = 1; m <= maxMonth; m++) {
      if (memberExistedInMonth(member, m, selectedYear)) {
        if (!isPaidForMonth(member, m, selectedYear)) return false;
      }
    }
    return true;
  }, [selectedYear, currentYear, currentMonth]);

  const filteredMembers = useMemo(() => {
    if (!childData?.members) return [];
    let members = childData.members;

    if (search) {
      const q = search.toLowerCase();
      members = members.filter(m => m.fullName.toLowerCase().includes(q) || (m.phone || "").toLowerCase().includes(q));
    }
    if (filter === "lunas") members = members.filter(m => isFullyPaidChild(m));
    if (filter === "belum") members = members.filter(m => !isFullyPaidChild(m));

    if (dateRange?.from) {
      members = members.filter(m => {
        return (m.contributions || []).some(c => {
          const cDate = new Date(c.paidAt);
          cDate.setHours(0, 0, 0, 0);
          const from = new Date(dateRange.from!); from.setHours(0, 0, 0, 0);
          if (cDate < from) return false;
          if (dateRange.to) {
            const to = new Date(dateRange.to); to.setHours(23, 59, 59, 999);
            if (cDate > to) return false;
          }
          return true;
        });
      });
    }

    return members;
  }, [childData, search, filter, isFullyPaidChild, dateRange]);

  // === FILTERING LOGIC (PARENT/RW LEVEL) ===
  const filteredGroups = useMemo(() => {
    if (!parentData?.childGroups) return [];
    let groups = parentData.childGroups;

    if (search) {
      const q = search.toLowerCase();
      groups = groups.filter(g => g.name.toLowerCase().includes(q) || g.adminName.toLowerCase().includes(q));
    }
    if (filter === "lunas") groups = groups.filter(g => g.isFullyPaid);
    if (filter === "belum") groups = groups.filter(g => !g.isFullyPaid);

    return groups;
  }, [parentData, search, filter]);

  // Statistics
  const totalItems = isParentLevel ? (parentData?.childGroups?.length || 0) : (childData?.members?.length || 0);
  const paidCount = isParentLevel
    ? (parentData?.childGroups?.filter(g => g.isFullyPaid).length || 0)
    : (childData?.members?.filter(m => isFullyPaidChild(m)).length || 0);
  const unpaidCount = totalItems - paidCount;
  
  // --- TENTUKAN BACK PATH UNTUK TOMBOL KEMBALI ---
  const handleBack = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = user.roleType || user.role?.type;
      
      // Arahkan ke rute induk berdasarkan role yang sedang login
      if (role === "TREASURER") {
        navigate("/dashboard/pembayaran-bendahara");
      } else {
        navigate("/dashboard/pembayaran");
      }
    } catch {
      navigate(-1); // Fallback ke riwayat browser jika ada error parsing
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* HEADER DENGAN TOMBOL KEMBALI */}
      <div className="flex flex-col gap-4">
        {/* Tampilkan tombol kembali HANYA jika paramGroupId ada isinya (sedang drill-down) */}
        {paramGroupId && (
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="mb-2 -ml-3 text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Rekapitulasi RW
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
              Progres Pembayaran {isParentLevel ? parentData?.group?.name : childData?.group?.name}
            </h1>
            <p className="text-sm sm:text-base text-slate-500 mt-1">
              {isParentLevel
                ? "Pantau status kolektibilitas iuran per wilayah RT."
                : "Pantau progres pembayaran iuran bulanan masing-masing warga."}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Total {isParentLevel ? "Lingkungan (RT)" : "Warga"}
            </CardTitle>
            {isParentLevel ? <Building2 className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-slate-900">{totalItems}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">Lunas Terkini</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-emerald-600">{paidCount}</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">Ada Tunggakan</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold text-red-600">{unpaidCount}</div>}
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col xl:flex-row gap-3 bg-white p-3 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder={isParentLevel ? "Cari nama RT atau pengurus..." : "Cari nama warga atau telepon..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 w-full border-slate-200"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center gap-2 px-2 border-r border-slate-200">
            <ListFilter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-500">Filter:</span>
          </div>

          {/* === DIPERBESAR: w-[140px] === */}
          <Select value={filter} onValueChange={(v) => setFilter(v as FilterMode)}>
            <SelectTrigger className="w-[145px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="lunas">Sudah Lunas</SelectItem>
              <SelectItem value="belum">Ada Tunggakan</SelectItem>
            </SelectContent>
          </Select>

          {!isParentLevel && (
            <DateRangeFilter
              value={dateRange}
              onChange={setDateRange}
              placeholder="Cari Tgl Bayar"
            />
          )}

          {/* === DIPERBESAR: w-[120px] === */}
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px] h-10 bg-slate-50 border-slate-200">
              <Calendar className="h-4 w-4 mr-1 text-slate-500" />
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

      <DuesProgressTable
        isParentLevel={isParentLevel}
        loading={loading}
        selectedYear={selectedYear}
        currentMonth={currentMonth}
        currentYear={currentYear}
        parentData={filteredGroups}
        childData={filteredMembers}
        isFullyPaidChild={isFullyPaidChild}
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <span className="text-slate-700 mr-2"><Info className="h-4 w-4 inline mr-1" /> Keterangan:</span>
        {isParentLevel ? (
          <>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-emerald-500 shadow-inner" /><span>100% Terkumpul</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-amber-400 shadow-inner" /><span>Terkumpul Sebagian</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-red-400 shadow-inner" /><span>Nihil (Kosong)</span></div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-emerald-500 shadow-inner" /><span>Sudah Lunas</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-red-400 shadow-inner" /><span>Menunggak</span></div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-slate-200 shadow-inner" /><span>Belum Terdaftar</span></div>
          </>
        )}
        <div className="flex items-center gap-1.5 ml-auto sm:ml-4"><div className="w-5 h-1 rounded-full bg-primary" /><span>Bulan Berjalan</span></div>
      </div>
    </div>
  );
}