import { useEffect, useState } from "react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import { fundRequestService } from "@/features/finance/services/fundRequestService";
import { eventService } from "@/features/event/services/eventService";
import { groupService } from "@/features/organization/services/groupService";
import { userService } from "@/shared/services/userService";
import type {
  WalletDetail,
  EventItem,
  GroupItem,
  UserItem,
  FundRequest,
} from "@/shared/types";
import {
  StatsCards,
  ActionRequired,
  RecentEventsCard,
  RecentFundRequests,
  QuickLinks,
} from "@/features/dashboard/components";

export default function LeaderDashboard() {
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [fundRequests, setFundRequests] = useState<FundRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [walletRes, eventsRes, groupsRes, usersRes, fundRequestsRes] =
          await Promise.allSettled([
            financeService.getWalletDetails(),
             eventService.getAll(),
            groupService.getAll(),
            userService.getAll(),
            fundRequestService.getAll(),
          ]);

        if (walletRes.status === "fulfilled") setWallet(walletRes.value);
        if (eventsRes.status === "fulfilled") setEvents(eventsRes.value);
        if (groupsRes.status === "fulfilled") setGroups(groupsRes.value);
        if (usersRes.status === "fulfilled") setUsers(usersRes.value);
        if (fundRequestsRes.status === "fulfilled") setFundRequests(fundRequestsRes.value);

        const failures = [walletRes, eventsRes, groupsRes, usersRes, fundRequestsRes].filter(
          (r) => r.status === "rejected"
        );
        if (failures.length > 0 && failures.length < 5) {
          toast.error("Sebagian data gagal dimuat.");
        } else if (failures.length === 5) {
          toast.error("Gagal memuat data dashboard.");
        }
      } catch {
        toast.error("Terjadi kesalahan saat memuat dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Derived data
  const pendingEvents = events.filter((e) => e.status === "PENDING_APPROVAL");
  const activeEvents = events.filter((e) => e.status === "APPROVED" || e.status === "IN_PROGRESS");
  const pendingFundRequests = fundRequests.filter((f) => f.status === "PENDING");
  const rtGroups = groups.filter((g) => g.type === "RT");

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900 tracking-tight">
          Dashboard <span className="text-brand-green">{wallet?.communityGroup?.name || "—"}</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Ringkasan data dan statistik seluruh warga.
        </p>
      </div>

      <StatsCards
        usersCount={users.length}
        rtCount={rtGroups.length}
        wallet={wallet}
        activeEventsCount={activeEvents.length}
        loading={loading}
      />

      <ActionRequired
        pendingEvents={pendingEvents}
        pendingFundRequests={pendingFundRequests}
        loading={loading}
      />

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <RecentEventsCard events={events} loading={loading} viewAllLink="/dashboard/kegiatan" />
        <RecentFundRequests fundRequests={fundRequests} loading={loading} />
      </div>

      <QuickLinks />
    </div>
  );
}