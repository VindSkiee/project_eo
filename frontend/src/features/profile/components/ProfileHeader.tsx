import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  Loader2,
  Camera,
} from "lucide-react";
import type { UserItem } from "@/shared/types";
import { getRoleLabel, loadCustomRoleLabels } from "@/shared/helpers/roleLabel";
import { getAvatarUrl } from "@/shared/helpers/avatarUrl";

interface ProfileHeaderProps {
  profile: UserItem;
  uploading: boolean;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ProfileHeader({ profile, uploading, onPhotoUpload }: ProfileHeaderProps) {
  const photoUrl = getAvatarUrl(profile.profileImage);
  const resolvedRoleType = profile.roleType || profile.role?.type || "";
  // Load custom labels and store in state so re-render fires after fetch
  const [displayRole, setDisplayRole] = useState(getRoleLabel(resolvedRoleType));

  useEffect(() => {
    loadCustomRoleLabels().then(() => {
      setDisplayRole(getRoleLabel(resolvedRoleType));
    });
  }, [resolvedRoleType]);

  return (
    <Card className="relative overflow-hidden p-0 border-0 shadow-sm ring-1 ring-slate-200/60 rounded-xl">
      {/* Cover Banner Area - Gunakan absolute agar paksa menempel ke ujung atas */}
      <div className="absolute top-0 left-0 right-0 h-28 w-full bg-gradient-to-r from-green-500/90 to-[#018656]"></div>

      {/* Spacer pengisi ruang untuk banner karena div di atas sekarang absolute */}
      <div className="h-28 w-full shrink-0"></div>

      <CardContent className="relative px-6 pb-8 pt-0 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-5">

          {/* Avatar Section with overlap */}
          <div className="relative -mt-12 sm:-mt-14 z-10 shrink-0">
            <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white shadow-md bg-white">
              {photoUrl && <AvatarImage src={photoUrl} alt={profile.fullName} className="object-cover" />}
              <AvatarFallback className="bg-slate-50 text-slate-600 font-bold text-3xl font-poppins">
                {profile.fullName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            {/* Upload Button Badge */}
            <label
              className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors group"
              title="Ganti foto"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 text-slate-500 group-hover:text-indigo-600 transition-colors" />
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

          {/* Profile Title & Badges */}
          <div className="flex-1 pb-1">
            <h2 className="text-2xl font-bold text-slate-900 font-poppins tracking-tight">
              {profile.fullName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-slate-200 text-black hover:bg-indigo-100 border-0">
                {displayRole}
              </Badge>
              <Badge
                variant={profile.isActive ? "default" : "destructive"}
                className={profile.isActive ? "bg-emerald-500 hover:bg-emerald-600 text-white" : ""}
              >
                {profile.isActive ? "Aktif" : "Nonaktif"}
              </Badge>
            </div>
          </div>
        </div>

        <hr className="my-6 border-slate-100" />

        {/* Contact & Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <Mail className="h-4 w-4" />
            </div>
            <span className="truncate font-medium">{profile.email}</span>
          </div>

          {profile.phone && (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Phone className="h-4 w-4" />
              </div>
              <span className="font-medium">{profile.phone}</span>
            </div>
          )}

          {profile.address && (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="font-medium line-clamp-2">{profile.address}</span>
            </div>
          )}

          {profile.communityGroup && (
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-medium">{profile.communityGroup.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}