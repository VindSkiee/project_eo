import { Users, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { DataTable, type ColumnDef } from "@/shared/components/DataTable";
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

function getRoleBadgeClass(roleType: string) {
  if (roleType === "LEADER") return "bg-indigo-50 text-indigo-700";
  if (roleType === "ADMIN") return "bg-blue-50 text-blue-700";
  if (roleType === "TREASURER") return "bg-amber-50 text-amber-700";
  return "bg-slate-50 text-slate-600";
}

// Buka file RtMemberTable.tsx dan ubah interface-nya menjadi seperti ini:
export interface RtMemberTableProps {
  members: UserItem[];
  loading: boolean;
  currentUserId?: string;
  onMemberClick?: (userId: string) => void;      // <-- Tambahkan ?
  onEdit?: (user: UserItem) => void;             // <-- Tambahkan ?
  onDelete?: (id: string, name: string) => void; // <-- Tambahkan ?
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

  // Deklarasi kolom dasar (Nama, Email, Role)
  const columns: ColumnDef<UserItem>[] = [
    {
      key: "name",
      header: "Nama",
      render: (member) => {
        const isSelf = !!(currentUserId && member.id === currentUserId);
        return (
          <div className="flex items-center gap-2">
            <Avatar className={`h-7 w-7 shrink-0 ${isSelf ? "ring-2 ring-primary/30" : ""}`}>
              {getAvatarUrl(member.profileImage) && (
                <AvatarImage src={getAvatarUrl(member.profileImage)!} alt={member.fullName} className="object-cover" />
              )}
              <AvatarFallback
                className={`text-xs font-medium ${
                  isSelf
                    ? "bg-primary/20 text-primary"
                    : "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600"
                }`}
              >
                {member.fullName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p
                className={`transition-colors ${
                  isSelf
                    ? "font-bold text-primary"
                    : "font-medium text-slate-700 group-hover:text-slate-900"
                }`}
              >
                {member.fullName}
                {isSelf && (
                  <span className="ml-1.5 text-[10px] font-semibold bg-brand-green text-white px-1.5 py-0.5 rounded-full">
                    saya
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "email",
      header: "Email",
      hideBelow: "sm",
      cellClassName: "text-slate-500",
      render: (member) => member.email,
    },
    {
      key: "role",
      header: "Role",
      render: (member) => {
        const roleType = member.roleType || member.role?.type || "RESIDENT";
        return (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(roleType)}`}
          >
            {getRoleLabel(roleType)}
          </span>
        );
      },
    },
  ];

  // LOGIKA CERDAS: Hanya tambahkan kolom "Aksi" JIKA onEdit atau onDelete di-pass
  // dan nilainya benar-benar sebuah fungsi (bukan undefined)
  if (onEdit || onDelete) {
    columns.push({
      key: "actions",
      header: "Aksi",
      render: (member) => {
        // Cek Keamanan Ekstra (Frontend):
        // Admin RT tidak boleh mengedit RW (LEADER). 
        // Jika perlu, Anda bisa menambahkan pengecekan role currentUser di sini,
        // Tapi untuk saat ini, kita sembunyikan tombol aksi jika itu adalah LEADER
        const roleType = member.roleType || member.role?.type;
        if (roleType === "LEADER") return <span className="text-xs text-slate-300">-</span>;

        return (
          <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()} // Mencegah klik row (onMemberClick) terpanggil
          >
            {onEdit && (
              <button
                onClick={() => onEdit(member)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-500 transition-all duration-200"
                title="Edit Anggota"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(member.id, member.fullName)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                title="Hapus Anggota"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        );
      },
    });
  }

  return (
    <div className="bg-white rounded-lg border border-slate-100 overflow-hidden shadow-sm">
      <DataTable
        columns={columns}
        data={sorted}
        keyExtractor={(m) => m.id}
        onRowClick={(m) => onMemberClick?.(m.id)}
        showRowNumber
        rowNumberPadded
      />
    </div>
  );
}
