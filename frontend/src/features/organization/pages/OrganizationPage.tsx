import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Skeleton } from "@/shared/ui/skeleton";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import {
  Building2,
  Search,
  Trash2,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { groupService } from "@/features/organization/services/groupService";
import { userService } from "@/shared/services/userService";
import type { GroupItem, UserItem } from "@/shared/types";
import {
  OrganizationSummaryCards,
  CreateRtDialog,
  CreateWargaDialog,
  EditRtDialog,
  EditWargaDialog,
  RtMemberTable,
  WargaTable,
} from "@/features/organization/components";

export default function OrganizationPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRT, setSearchRT] = useState("");
  const [searchWarga, setSearchWarga] = useState("");

  // Dialog states
  const [submitting, setSubmitting] = useState(false);

  // Edit RT Dialog
  const [editingGroup, setEditingGroup] = useState<GroupItem | null>(null);
  const [editGroupName, setEditGroupName] = useState("");

  // Edit User Dialog
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    roleType: "RESIDENT",
    communityGroupId: undefined as number | undefined,
  });

  // Collapsible state: which RT is expanded
  const [expandedRT, setExpandedRT] = useState<number | null>(null);
  const [rtMembers, setRtMembers] = useState<Record<number, UserItem[]>>({});
  const [rtMemberCounts, setRtMemberCounts] = useState<Record<number, number>>({});
  const [loadingMembers, setLoadingMembers] = useState<number | null>(null);

  // Check role from localStorage
  const userRole = (() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) return JSON.parse(stored).role;
    } catch { /* ignore */ }
    return null;
  })();

  const isLeader = userRole === "LEADER";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [groupsData, usersData] = await Promise.allSettled([
        groupService.getAll(),
        isLeader ? userService.getAll() : Promise.resolve([]),
      ]);

      if (groupsData.status === "fulfilled") setGroups(groupsData.value);
      if (usersData.status === "fulfilled") setUsers(usersData.value);

      if (groupsData.status === "rejected") toast.error("Gagal memuat data organisasi.");
      
      // Fetch member counts for all RT groups
      if (isLeader && groupsData.status === "fulfilled") {
        const rtGroupsData = groupsData.value.filter((g) => g.type === "RT");
        const countPromises = rtGroupsData.map((rt) =>
          userService.getCountByGroup(rt.id)
            .then((count) => ({ id: rt.id, count }))
            .catch(() => ({ id: rt.id, count: 0 }))
        );
        const counts = await Promise.all(countPromises);
        const countsMap = counts.reduce((acc, { id, count }) => {
          acc[id] = count;
          return acc;
        }, {} as Record<number, number>);
        setRtMemberCounts(countsMap);
      }
    } catch {
      toast.error("Gagal memuat data.");
    } finally {
      setLoading(false);
    }
  };

  const rwGroups = groups.filter((g) => g.type === "RW");
  const rtGroups = groups.filter((g) => g.type === "RT");

  const filteredRT = rtGroups.filter((g) =>
    g.name.toLowerCase().includes(searchRT.toLowerCase())
  );

  const filteredWarga = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchWarga.toLowerCase()) ||
      u.email.toLowerCase().includes(searchWarga.toLowerCase())
  );

  // === Fetch members for an RT group ===
  const fetchRTMembers = useCallback(async (groupId: number) => {
    if (rtMembers[groupId]) return;
    setLoadingMembers(groupId);
    try {
      const res = await userService.getFiltered({ communityGroupId: groupId, limit: 100 });

      // Handle response structure: res is the data array or res.data contains the array
      const usersArray = Array.isArray(res) ? res : (res?.data || []);

      setRtMembers((prev) => ({ ...prev, [groupId]: usersArray }));

    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat anggota RT.");
    } finally {
      setLoadingMembers(null);
    }
  }, [rtMembers]);

  const toggleRT = (groupId: number) => {
    if (expandedRT === groupId) {
      setExpandedRT(null);
    } else {
      setExpandedRT(groupId);
      fetchRTMembers(groupId);
    }
  };

  // === Open Edit Dialogs ===
  const openEditGroup = (group: GroupItem) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
  };

  // === Handle Edit User ===
  const openEditUser = (user: UserItem) => {
    setEditingUser(user);

    // LOGIKA PERBAIKAN DISINI:
    // Ambil role dari roleType ATAU role.type
    const actualRole = user.roleType || user.role?.type || "RESIDENT";

    // Ambil Group ID (jaga-jaga jika backend kirim object communityGroup)
    const actualGroupId = user.communityGroupId || user.communityGroup?.id;

    setEditUserForm({
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || "",
      address: user.address || "",
      roleType: actualRole, // Gunakan hasil deteksi diatas
      communityGroupId: actualGroupId ?? undefined,
    });
  };

  // === Handle Delete RT ===
  const handleDeleteGroup = async (id: number, name: string) => {
    if (!confirm(`Yakin ingin menghapus ${name}? Aksi ini tidak dapat dibatalkan.`)) return;
    try {
      await groupService.delete(id);
      toast.success(`${name} berhasil dihapus.`);
      fetchData();
    } catch {
      toast.error("Gagal menghapus grup.");
    }
  };

  // === Handle Delete User ===
  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus ${name}? Aksi ini tidak dapat dibatalkan.`)) return;
    try {
      await userService.delete(id);
      toast.success(`${name} berhasil dihapus.`);
      fetchData();
    } catch {
      toast.error("Gagal menghapus warga.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
            Organisasi
          </h1>
          <p className="text-sm sm:text-base text-slate-500 mt-1">
            Kelola data RT dan Warga di lingkungan Anda.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <OrganizationSummaryCards
        groups={groups}
        rwGroups={rwGroups}
        rtGroups={rtGroups}
        users={users}
        loading={loading}
        isLeader={isLeader}
      />

      {/* === TABS: Data RT / Data Warga === */}
      {isLeader ? (
        <Tabs defaultValue="data-rt" className="space-y-4">
          <TabsList>
            <TabsTrigger value="data-rt">Data RT</TabsTrigger>
            <TabsTrigger value="data-warga">Data Warga</TabsTrigger>
          </TabsList>

          {/* === TAB: Data RT === */}
          <TabsContent value="data-rt" className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari RT..."
                  value={searchRT}
                  onChange={(e) => setSearchRT(e.target.value)}
                  className="pl-9 border-slate-200 focus:border-slate-300 h-10"
                />
              </div>

              <CreateRtDialog onSuccess={fetchData} />
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredRT.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {searchRT ? "RT tidak ditemukan" : "Belum ada data RT"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchRT ? "Coba gunakan kata kunci lain" : "Mulai dengan menambahkan RT baru"}
                </p>
              </div>
            ) : (
              /* RT List */
              <div className="space-y-3">
                {filteredRT.map((group) => {
                  const parentRw = rwGroups.find((rw) => rw.id === group.parentId);
                  const isExpanded = expandedRT === group.id;
                  const members = rtMembers[group.id] || [];
                  const isLoadingThisRT = loadingMembers === group.id;

                  return (
                    <Collapsible
                      key={group.id}
                      open={isExpanded}
                      onOpenChange={() => toggleRT(group.id)}
                    >
                      <Card className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                        {/* RT Header - Collapsible Trigger */}
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50/80 transition-colors">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <ChevronDown
                                className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"
                                  }`}
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 text-sm sm:text-base">
                                  {group.name}
                                </p>
                               
                                <p className="text-xs text-slate-500">
                                  {parentRw?.name || "—"} &middot;{" "}
                                  {rtMemberCounts[group.id] !== undefined 
                                    ? `${rtMemberCounts[group.id]} warga` 
                                    : "—"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge
                                variant="secondary"
                                className="text-xs font-medium bg-slate-100 text-slate-600 border-0 mr-1"
                              >
                                {group.type}
                              </Badge>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditGroup(group);
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-500 transition-all duration-200"
                                title="Edit RT"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteGroup(group.id, group.name);
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                                title="Hapus RT"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        {/* Expanded Content - Member List */}
                        <CollapsibleContent>
                          <div className="border-t border-slate-100 bg-slate-50/50 p-4">
                            <RtMemberTable
                              members={members}
                              loading={isLoadingThisRT}
                              onMemberClick={(memberId) => navigate(`/dashboard/users/${memberId}`)}
                              onEdit={openEditUser}
                              onDelete={handleDeleteUser}
                            />
                          </div>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* === TAB: Data Warga === */}
          <TabsContent value="data-warga" className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari warga..."
                  value={searchWarga}
                  onChange={(e) => setSearchWarga(e.target.value)}
                  className="pl-9 border-slate-200 focus:border-slate-300 h-10"
                />
              </div>

              <CreateWargaDialog groups={groups} onSuccess={fetchData} />
            </div>

            {/* Table Section */}
            <WargaTable
              users={filteredWarga}
              loading={loading}
              searchQuery={searchWarga}
              onUserClick={(userId) => navigate(`/dashboard/users/${userId}`)}
              onEdit={openEditUser}
              onDelete={handleDeleteUser}
            />
          </TabsContent>
        </Tabs>
      ) : (
        /* === NON-LEADER VIEW (RESIDENT) - Simple Card List === */
        <>
          {loading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20 mt-1" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : groups.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Building2 className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500 font-medium">
                  Belum ada data organisasi.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Data organisasi RT/RW akan tampil di sini.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {rwGroups.length > 0 && (
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 font-poppins">
                    Rukun Warga (RW)
                  </h2>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {rwGroups.map((group) => (
                      <Card key={group.id}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm sm:text-base font-semibold text-slate-900">
                              {group.name}
                            </CardTitle>
                            <Badge variant="default" className="text-[10px] sm:text-xs">
                              {group.type}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs text-slate-400">
                            Dibuat{" "}
                            {new Date(group.createdAt).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {rtGroups.length > 0 && (
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 font-poppins">
                    Rukun Tetangga (RT)
                  </h2>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {rtGroups.map((group) => {
                      const parentRw = rwGroups.find((rw) => rw.id === group.parentId);
                      return (
                        <Card key={group.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-sm sm:text-base font-semibold text-slate-900">
                                {group.name}
                              </CardTitle>
                              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                                {group.type}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs text-slate-400">
                              {parentRw ? `Bagian dari ${parentRw.name}` : "Tanpa induk RW"}
                              {" · "}
                              Dibuat{" "}
                              {new Date(group.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </CardDescription>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
      
      {/* === Edit Dialogs === */}
      {isLeader && (
        <>
          <EditRtDialog
            group={editingGroup}
            name={editGroupName}
            onNameChange={setEditGroupName}
            onClose={() => setEditingGroup(null)}
            onSuccess={() => {
              setEditingGroup(null);
              fetchData();
              if (editingGroup) {
                setRtMembers((prev) => {
                  const copy = { ...prev };
                  delete copy[editingGroup.id];
                  return copy;
                });
              }
            }}
            submitting={submitting}
            setSubmitting={setSubmitting}
          />

          <EditWargaDialog
            user={editingUser}
            groups={groups}
            form={editUserForm}
            onFormChange={setEditUserForm}
            onClose={() => setEditingUser(null)}
            onSuccess={() => {
              setEditingUser(null);
              fetchData();
              setRtMembers({});
            }}
            submitting={submitting}
            setSubmitting={setSubmitting}
          />
        </>
      )}
    </div>
  );
}
