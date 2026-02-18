import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";
import { Building2, Network, Users } from "lucide-react";
import type { GroupItem, UserItem } from "@/shared/types";

interface OrganizationSummaryCardsProps {
  groups: GroupItem[];
  rwGroups: GroupItem[];
  rtGroups: GroupItem[];
  users: UserItem[];
  loading: boolean;
  isLeader: boolean;
}

export function OrganizationSummaryCards({
  groups,
  rwGroups,
  rtGroups,
  users,
  loading,
  isLeader,
}: OrganizationSummaryCardsProps) {
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
            Total Grup
          </CardTitle>
          <Building2 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="text-2xl font-bold text-slate-900">{groups.length}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
            RW
          </CardTitle>
          <Network className="h-4 w-4 text-emerald-600" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="text-2xl font-bold text-slate-900">{rwGroups.length}</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
            {isLeader ? "Total Warga" : "RT"}
          </CardTitle>
          {isLeader ? (
            <Users className="h-4 w-4 text-blue-600" />
          ) : (
            <Building2 className="h-4 w-4 text-blue-600" />
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="text-2xl font-bold text-slate-900">
              {isLeader ? users.length : rtGroups.length}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
