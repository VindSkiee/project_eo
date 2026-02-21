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

interface WargaTableProps {
  users: UserItem[];
  loading: boolean;
  searchQuery: string;
  currentUserId?: string;
  onUserClick: (userId: string) => void;
  onEdit: (user: UserItem) => void;
  onDelete: (userId: string, userName: string) => void;
}

export function WargaTable({
  users,
  loading,
  searchQuery,
  currentUserId,
  onUserClick,
  onEdit,
  onDelete,
}: WargaTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Users className="h-6 w-6 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-600">
          {searchQuery ? "Warga tidak ditemukan" : "Belum ada data warga"}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          {searchQuery ? "Coba gunakan kata kunci lain" : "Mulai dengan menambahkan warga baru"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                No
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Nama
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider hidden sm:table-cell">
                Email
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:table-cell">
                Grup
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortMembers(users, currentUserId).map((user, idx) => {
              const isSelf = !!(currentUserId && user.id === currentUserId);
              return (
              <tr
                key={user.id}
                onClick={() => onUserClick(user.id)}
                className="group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm text-slate-400 font-mono">
                    {(idx + 1).toString().padStart(2, "0")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-left">
                  <div className="flex items-center gap-3">
                    <Avatar className={`h-8 w-8 shrink-0 ${isSelf ? 'ring-2 ring-primary/30' : ''}`}>
                      {getAvatarUrl(user.profileImage) && <AvatarImage src={getAvatarUrl(user.profileImage)!} alt={user.fullName} className="object-cover" />}
                      <AvatarFallback className={`text-xs font-medium ${isSelf ? 'bg-primary/20 text-primary' : 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600'}`}>
                        {user.fullName?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className={`transition-colors ${isSelf ? "font-bold text-primary" : "font-medium text-slate-700 group-hover:text-slate-900"}`}>
                        {user.fullName}
                        {isSelf && <span className="ml-1.5 text-[10px] font-semibold bg-brand-green text-white px-1.5 py-0.5 rounded-full">saya</span>}
                      </p>
                      <p className="text-xs text-slate-400 sm:hidden mt-0.5">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-slate-500 hidden sm:table-cell">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span
                    className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${
                        user.roleType === "LEADER" || user.role?.type === "LEADER"
                          ? "bg-indigo-50 text-indigo-700"
                          : user.roleType === "ADMIN" || user.role?.type === "ADMIN"
                          ? "bg-blue-50 text-blue-700"
                          : user.roleType === "TREASURER" || user.role?.type === "TREASURER"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-50 text-slate-600"
                      }
                    `}
                  >
                    {getRoleLabel((user.roleType || user.role?.type) ?? "RESIDENT")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-slate-500 hidden md:table-cell">
                  <span className="text-sm">{user.communityGroup?.name || "—"}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span
                    className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}
                    `}
                  >
                    <span
                      className={`
                        h-1.5 w-1.5 rounded-full mr-1.5
                        ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}
                      `}
                    />
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <div
                    className="flex items-center justify-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => onEdit(user)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-500 transition-all duration-200"
                      title="Edit Warga"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id, user.fullName)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                      title="Hapus Warga"
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

      {/* Footer dengan info jumlah data */}
      <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 text-xs text-slate-400 text-center">
        Menampilkan {users.length} warga
      </div>
    </div>
  );
}
