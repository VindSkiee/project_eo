import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Mail, Phone, MapPin, Building2 } from "lucide-react";
import type { UserItem } from "@/shared/types";

const roleLabel = (roleType: string) => {
  switch (roleType) {
    case "LEADER": return "Ketua RW";
    case "ADMIN": return "Ketua RT";
    case "TREASURER": return "Bendahara";
    default: return "Warga";
  }
};

interface UserProfileCardProps {
  user: UserItem;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Card>
      <CardContent className="py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          <Avatar className="h-20 w-20 border-2 border-primary/10 shadow-md">
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
                  variant={user.roleType === "LEADER" ? "default" : user.roleType === "ADMIN" ? "secondary" : "outline"}
                >
                  {roleLabel(user.roleType)}
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
