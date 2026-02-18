import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import type { UserItem } from "@/shared/types";

const roleLabel = (roleType: string) => {
  switch (roleType) {
    case "LEADER": return "Ketua RW";
    case "ADMIN": return "Ketua RT";
    case "TREASURER": return "Bendahara";
    default: return "Warga";
  }
};

interface UserAdditionalInfoProps {
  user: UserItem;
}

export function UserAdditionalInfo({ user }: UserAdditionalInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-poppins">Informasi Tambahan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Email</p>
            <p className="font-medium text-slate-900">{user.email}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Role</p>
            <p className="font-medium text-slate-900">{roleLabel(user.roleType)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Telepon</p>
            <p className="font-medium text-slate-900">{user.phone || "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Alamat</p>
            <p className="font-medium text-slate-900">{user.address || "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Grup</p>
            <p className="font-medium text-slate-900">{user.communityGroup?.name || "—"}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs mb-0.5">Bergabung</p>
            <p className="font-medium text-slate-900">
              {new Date(user.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
