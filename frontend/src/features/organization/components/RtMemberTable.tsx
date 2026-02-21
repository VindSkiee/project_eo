import { Users, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import type { UserItem } from "@/shared/types";
import { getRoleLabel } from "@/shared/helpers/roleLabel";
import { getAvatarUrl } from "@/shared/helpers/avatarUrl";

function sortMembers(members: UserItem[], currentUserId?: string): UserItem[] {
  const getPriority = (u: UserItem): number => {
    if (currentUserId && u.id === currentUserId) return 0;
    const r = u.roleType || u.role?.type || "RESIDENT";
    if (r === "LEADER" || r === "ADMIN") return 1;
    if (r === "TREASURER") return 2;
    return 3;
  };
  return [...members].sort((a, b) => getPriority(a) - getPriority(b));
}

interface RtMemberTableProps {
  members: UserItem[];
  loading: boolean;
  currentUserId?: string;
  onMemberClick: (memberId: string) => void;
  onEdit: (member: UserItem) => void;
  onDelete: (memberId: string, memberName: string) => void;
}

export function RtMemberTable({
  members,
  loading,
  currentUserId,
  onMemberClick,
  onEdit,
  onDelete,
}: RtMemberTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <Users className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-xs font-medium text-slate-500">Belum ada anggota</p>
        <p className="text-xs text-slate-400 mt-1">Anggota akan muncul di sini</p>
      </div>
    );
  }

  const sorted = sortMembers(members, currentUserId);

  return (
    <div className="bg-white rounded-lg border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                Email
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sorted.map((member) => {
              const isSelf = !!(currentUserId && member.id === currentUserId);
              return (
                <tr
                  key={member.id}
                  onClick={() => onMemberClick(member.id)}
                  className="group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-left">
                    <div className="flex items-center gap-2">
                      <Avatar className={`h-7 w-7 shrink-0 ${isSelf ? 'ring-2 ring-primary/30' : ''}`}>
                        {getAvatarUrl(member.profileImage) && <AvatarImage src={getAvatarUrl(member.profileImage)!} alt={member.fullName} className="object-cover" />}
                        <AvatarFallback className={`text-xs font-medium ${isSelf ? 'bg-primary/20 text-primary' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'}`}>
                          {member.fullName?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className={`transition-colors ${isSelf ? "font-bold text-primary" : "font-medium text-slate-700 group-hover:text-slate-900"}`}>
                          {member.fullName}
                          {isSelf && <span className="ml-1.5 text-[10px] font-semibold bg-brand-green text-white px-1.5 py-0.5 rounded-full">saya</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center text-slate-500 hidden sm:table-cell">
                    {member.email}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <span
                      className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${
                          member.roleType === "LEADER" || member.role?.type === "LEADER"
                            ? "bg-indigo-50 text-indigo-700"
                            : member.roleType === "ADMIN" || member.role?.type === "ADMIN"
                            ? "bg-blue-50 text-blue-700"
                            : member.roleType === "TREASURER" || member.role?.type === "TREASURER"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-50 text-slate-600"
                        }
                      `}
                    >
                      {getRoleLabel((member.roleType || member.role?.type) ?? "RESIDENT")}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-center">
                    <div
                      className="flex items-center justify-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onEdit(member)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-500 transition-all duration-200"
                        title="Edit Anggota"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(member.id, member.fullName)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                        title="Hapus Anggota"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
