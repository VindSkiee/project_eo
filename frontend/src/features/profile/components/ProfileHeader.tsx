import {
  Card,
  CardContent,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Loader2,
  Camera,
} from "lucide-react";
import type { UserItem } from "@/shared/types";

const roleLabel = (roleType: string) => {
  switch (roleType) {
    case "LEADER": return "Ketua RW";
    case "ADMIN": return "Ketua RT";
    case "TREASURER": return "Bendahara";
    default: return "Warga";
  }
};

interface ProfileHeaderProps {
  profile: UserItem;
  uploading: boolean;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileHeader({ profile, uploading, onPhotoUpload }: ProfileHeaderProps) {
  return (
    <Card>
      <CardContent className="py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar with upload overlay */}
          <div className="relative group">
            <Avatar className="h-20 w-20 border-2 border-primary/10 shadow-md">
              <AvatarFallback className="bg-primary/5 text-primary font-bold text-2xl font-poppins">
                {profile.fullName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <label
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
              title="Ganti foto"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 text-white animate-spin" />
              ) : (
                <Camera className="h-5 w-5 text-white" />
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onPhotoUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <h2 className="text-xl font-bold text-slate-900 font-poppins">
              {profile.fullName}
            </h2>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <Badge variant="default">
                {profile.roleType ? roleLabel(profile.roleType) : "User"}
              </Badge>
              <Badge variant={profile.isActive ? "default" : "destructive"} className="text-[10px]">
                {profile.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 text-sm text-slate-500 mt-2">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {profile.email}
              </span>
              {profile.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {profile.phone}
                </span>
              )}
              {profile.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {profile.address}
                </span>
              )}
              {profile.communityGroup && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> {profile.communityGroup.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
