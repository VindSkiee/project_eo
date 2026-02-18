import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Users, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import { eventService } from "@/features/event/services/eventService";
import { groupService } from "@/features/organization/services/groupService";
import type { TransparencyBalance, MyBill, EventItem, GroupItem } from "@/shared/types";
import {
  BalanceCards,
  BillCard,
  AnnouncementSection,
} from "@/features/dashboard/components";

export default function ResidentDashboard() {
  const [balance, setBalance] = useState<TransparencyBalance | null>(null);
  const [bill, setBill] = useState<MyBill | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  const user = (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [balanceData, billData, eventsData, groupsData] = await Promise.allSettled(
          [
            financeService.getTransparencyBalance(),
            financeService.getMyBill(),
            eventService.getAll(),
            groupService.getAll(),
          ]
        );

        if (balanceData.status === "fulfilled") setBalance(balanceData.value);
        if (billData.status === "fulfilled") setBill(billData.value);
        if (eventsData.status === "fulfilled") setEvents(eventsData.value);
        if (groupsData.status === "fulfilled") setGroups(groupsData.value);
      } catch {
        toast.error("Terjadi kesalahan saat memuat data dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
          Halo, {user?.fullName || "Warga"}!
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Selamat datang di portal informasi warga.
        </p>
      </div>

      {/* === ROW 1: Saldo Kas RW & RT === */}
      <BalanceCards balance={balance} loading={loading} />

      {/* === ROW 2: Tagihan & Organisasi === */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <BillCard bill={bill} loading={loading} />

        {/* Jumlah Organisasi */}
        <Link to="/dashboard/organisasi" className="block">
          <Card className="h-full transition-shadow hover:shadow-md cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
                Organisasi
              </CardTitle>
              <Users className="h-4 w-4 text-violet-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-xl sm:text-2xl font-bold text-slate-900">
                    {groups.length}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary mt-1 group-hover:underline">
                    <span>Lihat semua organisasi</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* === ANNOUNCEMENT / EVENT SECTION === */}
      <AnnouncementSection events={events} loading={loading} />
    </div>
  );
}