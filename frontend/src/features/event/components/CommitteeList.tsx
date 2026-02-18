import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Users } from "lucide-react";
import type { EventItem } from "@/shared/types";

const participantRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    COMMITTEE: "Panitia",
    ATTENDEE: "Peserta",
    GUEST: "Tamu",
  };
  return labels[role] || role;
};

interface CommitteeListProps {
  event: EventItem;
}

export function CommitteeList({ event }: CommitteeListProps) {
  const committeeMembers = event.participants?.filter((p) => p.role === "COMMITTEE") || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Panitia ({committeeMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {committeeMembers.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Belum ada panitia terdaftar.
          </p>
        ) : (
          <div className="space-y-2">
            {committeeMembers.map((participant, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">
                    {participant.user.fullName}
                  </p>
                  <p className="text-xs text-slate-500">{participant.user.email}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {participantRoleLabel(participant.role)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
