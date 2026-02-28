import { useState, useEffect } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";
import type { UserItem } from "@/shared/types";
import { getRoleLabel, loadCustomRoleLabels } from "@/shared/helpers/roleLabel";
import { getAvatarUrl } from "@/shared/helpers/avatarUrl";

interface UserProfileCardProps {
  user: UserItem;
  roleLabel?: string;
}

export function UserProfileCard({ user, roleLabel }: UserProfileCardProps) {
  const avatarUrl = getAvatarUrl(user.profileImage);
  const resolvedRoleType = user.roleType || user.role?.type || "";
  // Load custom labels and store in state so re-render fires after fetch
  const [displayRole, setDisplayRole] = useState(roleLabel || getRoleLabel(resolvedRoleType));

  useEffect(() => {
    if (roleLabel) {
      setDisplayRole(roleLabel);
      return;
    }
    loadCustomRoleLabels().then(() => {
      setDisplayRole(getRoleLabel(resolvedRoleType));
    });
  }, [resolvedRoleType, roleLabel]);
  return (
    <Card>
      <CardContent className="py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar className="h-20 w-20 border-2 border-primary/10 shadow-md">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={user.fullName} className="object-cover" />}
            <AvatarFallback className="bg-primary/5 text-primary font-bold text-2xl font-poppins">
              {user.fullName?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins">
                {user.fullName}
              </h1>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <Badge
                  variant="outline"
                  className={
                    user.roleType === "LEADER"
                      ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                      : user.roleType === "ADMIN"
                      ? "bg-blue-100 text-blue-700 border-blue-200"
                      : user.roleType === "TREASURER"
                      ? "bg-amber-100 text-amber-700 border-amber-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }
                >
                  {displayRole}
                </Badge>
                <Badge variant={user.isActive ? "default" : "destructive"} className="text-[10px]">
                  {user.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </span>
              {user.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {user.phone}
                </span>
              )}
              {user.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {user.address}
                </span>
              )}
              {user.communityGroup && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {user.communityGroup.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
