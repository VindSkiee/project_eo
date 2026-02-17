import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  Network,
  Plus,
  Users,
  Search,
  Trash2,
  Loader2,
  ChevronDown,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import {
  dashboardService,
  type GroupItem,
  type UserItem,
} from "@/services/dashboardService";

// === Role label helper ===
const roleLabel = (role: string) => {
  switch (role) {
    case "LEADER":
      return "Ketua RW";
    case "ADMIN":
      return "Ketua RT";
    case "TREASURER":
      return "Bendahara";
    case "RESIDENT":
      return "Warga";
    default:
      return role || "Warga"; // Fallback jika null/undefined
  }
};

export default function OrganizationPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchRT, setSearchRT] = useState("");
  const [searchWarga, setSearchWarga] = useState("");

  // Dialog states
  const [showCreateRT, setShowCreateRT] = useState(false);
  const [showAddWarga, setShowAddWarga] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Create RT form
  const [rtName, setRtName] = useState("");

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

  // Add Warga form
  const [wargaForm, setWargaForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    address: "",
    roleType: "RESIDENT", // <--- PERBAIKAN: Default harus valid
    communityGroupId: undefined as number | undefined,
  });

  // Collapsible state: which RT is expanded
  const [expandedRT, setExpandedRT] = useState<number | null>(null);
  const [rtMembers, setRtMembers] = useState<Record<number, UserItem[]>>({});
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
        dashboardService.getGroups(),
        isLeader ? dashboardService.getUsers() : Promise.resolve([]),
      ]);

      if (groupsData.status === "fulfilled") setGroups(groupsData.value);
      if (usersData.status === "fulfilled") setUsers(usersData.value);

      if (groupsData.status === "rejected") toast.error("Gagal memuat data organisasi.");
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
      const res = await dashboardService.getUsersFiltered({ communityGroupId: groupId, limit: 100 });

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

  // === Handle Create RT ===
  const handleCreateRT = async () => {
    if (!rtName.trim()) {
      toast.error('Nama RT wajib diisi (format: "RT XX")');
      return;
    }
    setSubmitting(true);
    try {
      await dashboardService.createGroup({ name: rtName.trim(), type: "RT" });
      toast.success("RT berhasil ditambahkan!");
      setShowCreateRT(false);
      setRtName("");
      fetchData();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const msg = Array.isArray(message) ? message[0] : message;
      toast.error(msg || "Gagal menambahkan RT.");
    } finally {
      setSubmitting(false);
    }
  };

  // === Handle Edit Group ===
  const openEditGroup = (group: GroupItem) => {
    setEditingGroup(group);
    setEditGroupName(group.name);
  };

  const handleEditGroup = async () => {
    if (!editingGroup || !editGroupName.trim()) return;
    setSubmitting(true);
    try {
      await dashboardService.updateGroup(editingGroup.id, { name: editGroupName.trim() });
      toast.success("RT berhasil diperbarui!");
      setEditingGroup(null);
      fetchData();
      setRtMembers((prev) => {
        const copy = { ...prev };
        delete copy[editingGroup.id];
        return copy;
      });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      const msg = Array.isArray(message) ? message[0] : message;
      toast.error(msg || "Gagal memperbarui RT.");
    } finally {
      setSubmitting(false);
    }
  };

  // === Handle Add Warga ===
  // === 1. Create User (Tambah Warga) ===
  const handleAddWarga = async () => {
    if (!wargaForm.email || !wargaForm.fullName) {
      toast.error("Email dan nama lengkap wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await dashboardService.createUser({
        email: wargaForm.email,
        fullName: wargaForm.fullName,

        // PENTING: Ubah string kosong "" menjadi undefined
        phone: wargaForm.phone === "" ? undefined : wargaForm.phone,
        address: wargaForm.address === "" ? undefined : wargaForm.address,

        roleType: wargaForm.roleType,

        // PENTING: Pastikan ini Number atau undefined (bukan 0 atau NaN)
        communityGroupId: wargaForm.communityGroupId ? Number(wargaForm.communityGroupId) : undefined,
      });

      toast.success("Warga berhasil ditambahkan!");
      setShowAddWarga(false);
      // Reset form ke default yang aman
      setWargaForm({
        email: "",
        fullName: "",
        phone: "",
        address: "",
        roleType: "RESIDENT",
        communityGroupId: undefined
      });
      fetchData();
    } catch (err: unknown) {
      console.error(err);
      const message = (err as any)?.response?.data?.message;
      const msg = Array.isArray(message) ? message[0] : (message || "Gagal menambahkan warga.");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
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

  // === 2. Update User (Edit Warga) ===
  const handleEditUser = async () => {
    if (!editingUser) return;
    setSubmitting(true);
    try {
      await dashboardService.updateUser(editingUser.id, {
        fullName: editUserForm.fullName || undefined,
        email: editUserForm.email || undefined,
        phone: editUserForm.phone || undefined,
        address: editUserForm.address || undefined,
        roleType: editUserForm.roleType, // Pastikan ini terisi dari openEditUser tadi

        // PENTING: Konversi ke Number
        communityGroupId: editUserForm.communityGroupId ? Number(editUserForm.communityGroupId) : undefined,
      });

      toast.success("Data warga berhasil diperbarui!");
      setEditingUser(null);
      fetchData();

      // Opsional: Clear cache member RT agar data ter-refresh saat dibuka lagi
      setRtMembers({});

    } catch (err: unknown) {
      console.error(err);
      const message = (err as any)?.response?.data?.message;
      // Ambil pesan error validasi pertama jika array
      const msg = Array.isArray(message) ? message[0] : (message || "Gagal memperbarui data warga.");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // === Handle Delete RT ===
  const handleDeleteGroup = async (id: number, name: string) => {
    if (!confirm(`Yakin ingin menghapus ${name}? Aksi ini tidak dapat dibatalkan.`)) return;
    try {
      await dashboardService.deleteGroup(id);
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
      await dashboardService.deleteUser(id);
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
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              Total Grup
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-slate-900">{groups.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              RW
            </CardTitle>
            <Network className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-slate-900">{rwGroups.length}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
              {isLeader ? "Total Warga" : "RT"}
            </CardTitle>
            {isLeader ? <Users className="h-4 w-4 text-blue-600" /> : <Building2 className="h-4 w-4 text-blue-600" />}
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold text-slate-900">
                {isLeader ? users.length : rtGroups.length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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

              <Dialog open={showCreateRT} onOpenChange={setShowCreateRT}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="h-10 px-4 bg-primary hover:bg-brand-green text-white gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah RT
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="font-poppins">Tambah RT Baru</DialogTitle>
                    <DialogDescription>
                      Masukkan nama RT dengan format "RT XX" (contoh: RT 01).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="rt-name">Nama RT</Label>
                      <Input
                        id="rt-name"
                        placeholder='Contoh: RT 01'
                        value={rtName}
                        onChange={(e) => setRtName(e.target.value)}
                        className="border-slate-200 focus:border-slate-300"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateRT(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleCreateRT} disabled={submitting} className="bg-primary hover:bg-brand-green text-white">
                      {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Simpan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
                                  {(rtMembers[group.id]?.length ?? 0)} warga
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
                            {isLoadingThisRT ? (
                              <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                                ))}
                              </div>
                            ) : members.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-8 px-4">
                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                  <Users className="h-5 w-5 text-slate-400" />
                                </div>
                                <p className="text-xs font-medium text-slate-500">Belum ada anggota</p>
                                <p className="text-xs text-slate-400 mt-1">Anggota akan muncul di sini</p>
                              </div>
                            ) : (
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
                                      {members.map((member) => (
                                        <tr
                                          key={member.id}
                                          onClick={() => navigate(`/dashboard/users/${member.id}`)}
                                          className="group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
                                        >
                                          <td className="px-4 py-3 whitespace-nowrap text-left">
                                            <div className="flex items-center gap-2">
                                              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                                <span className="text-xs font-medium text-slate-600">
                                                  {member.fullName?.charAt(0).toUpperCase()}
                                                </span>
                                              </div>
                                              <p className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                                {member.fullName}
                                              </p>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-center text-slate-500 hidden sm:table-cell">
                                            {member.email}
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <span className={`
                                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                    ${((member.roleType === "LEADER") || (member.role?.type === "LEADER"))
                                                ? "bg-indigo-50 text-indigo-700"
                                                : ((member.roleType === "ADMIN") || (member.role?.type === "ADMIN"))
                                                  ? "bg-blue-50 text-blue-700"
                                                  : ((member.roleType === "TREASURER") || (member.role?.type === "TREASURER"))
                                                    ? "bg-amber-50 text-amber-700"
                                                    : "bg-slate-50 text-slate-600"
                                              }
                                  `}>
                                              {roleLabel((member.roleType || member.role?.type) ?? "RESIDENT")}
                                            </span>
                                          </td>
                                          <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div
                                              className="flex items-center justify-center gap-1"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <button
                                                onClick={() => openEditUser(member)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-500 transition-all duration-200"
                                                title="Edit Anggota"
                                              >
                                                <Pencil className="h-3.5 w-3.5" />
                                              </button>

                                              <button
                                                onClick={() => handleDeleteUser(member.id, member.fullName)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                                                title="Hapus Anggota"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" />
                                              </button>
                                            </div>
                                          </td>

                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
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

              <Dialog open={showAddWarga} onOpenChange={setShowAddWarga}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="h-10 px-4 bg-primary hover:bg-brand-green text-white gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Warga
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-poppins">Tambah Warga Baru</DialogTitle>
                    <DialogDescription>
                      Masukkan data warga baru. Password default akan di-generate otomatis.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label htmlFor="warga-email">Email *</Label>
                      <Input
                        id="warga-email"
                        type="email"
                        placeholder="warga@email.com"
                        value={wargaForm.email}
                        onChange={(e) => setWargaForm({ ...wargaForm, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warga-name">Nama Lengkap *</Label>
                      <Input
                        id="warga-name"
                        placeholder="Nama lengkap"
                        value={wargaForm.fullName}
                        onChange={(e) => setWargaForm({ ...wargaForm, fullName: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warga-phone">No. Telepon</Label>
                      <Input
                        id="warga-phone"
                        placeholder="08xxxxxxxxx"
                        value={wargaForm.phone}
                        onChange={(e) => setWargaForm({ ...wargaForm, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warga-address">Alamat</Label>
                      <Input
                        id="warga-address"
                        placeholder="Alamat rumah"
                        value={wargaForm.address}
                        onChange={(e) => setWargaForm({ ...wargaForm, address: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={wargaForm.roleType}
                        onValueChange={(v) => setWargaForm({ ...wargaForm, roleType: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RESIDENT">Warga</SelectItem>
                          <SelectItem value="ADMIN">Ketua RT</SelectItem>
                          <SelectItem value="TREASURER">Bendahara</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Kelompok (RT)</Label>
                      <Select
                        value={wargaForm.communityGroupId?.toString() || ""}
                        onValueChange={(v) =>
                          setWargaForm({ ...wargaForm, communityGroupId: v ? Number(v) : undefined })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih RT" />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map((g) => (
                            <SelectItem key={g.id} value={g.id.toString()}>
                              {g.name} ({g.type})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddWarga(false)}>
                      Batal
                    </Button>
                    <Button onClick={handleAddWarga} disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      Simpan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Table Section */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : filteredWarga.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  {searchWarga ? "Warga tidak ditemukan" : "Belum ada data warga"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchWarga ? "Coba gunakan kata kunci lain" : "Mulai dengan menambahkan warga baru"}
                </p>
              </div>
            ) : (
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
                      {filteredWarga.map((user, idx) => (
                        <tr
                          key={user.id}
                          onClick={() => navigate(`/dashboard/users/${user.id}`)}
                          className="group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="text-sm text-slate-400 font-mono">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-left">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                <span className="text-xs font-medium text-slate-600">
                                  {user.fullName?.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                  {user.fullName}
                                </p>
                                <p className="text-xs text-slate-400 sm:hidden mt-0.5">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-slate-500 hidden sm:table-cell">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`
                    inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${((user.roleType === "LEADER") || (user.role?.type === "LEADER"))
                                ? "bg-indigo-50 text-indigo-700"
                                : ((user.roleType === "ADMIN") || (user.role?.type === "ADMIN"))
                                  ? "bg-blue-50 text-blue-700"
                                  : ((user.roleType === "TREASURER") || (user.role?.type === "TREASURER"))
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-slate-50 text-slate-600"
                              }
                  `}>
                              {roleLabel((user.roleType || user.role?.type) ?? "RESIDENT")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-slate-500 hidden md:table-cell">
                            <span className="text-sm">
                              {user.communityGroup?.name || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`
                    inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                    ${user.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                              }
                  `}>
                              <span className={`
                      h-1.5 w-1.5 rounded-full mr-1.5
                      ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}
                    `} />
                              {user.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div
                              className="flex items-center justify-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => openEditUser(user)}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-500 transition-all duration-200"
                                title="Edit Warga"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.fullName)}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                                title="Hapus Warga"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer dengan info jumlah data */}
                <div className="px-6 py-3 border-t border-slate-50 bg-slate-50/30 text-xs text-slate-400 text-center">
                  Menampilkan {filteredWarga.length} warga
                </div>
              </div>
            )}
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
      {/* === Edit Group Dialog === */}
      {isLeader && (
        <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-poppins">Edit RT</DialogTitle>
              <DialogDescription>Perbarui nama RT.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nama RT</Label>
                <Input
                  value={editGroupName}
                  onChange={(e) => setEditGroupName(e.target.value)}
                  placeholder='Contoh: RT 01'
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingGroup(null)}>Batal</Button>
              <Button onClick={handleEditGroup} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* === Edit User Dialog === */}
      {isLeader && (
        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-poppins">Edit Data Warga</DialogTitle>
              <DialogDescription>Perbarui informasi warga.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input
                  value={editUserForm.fullName}
                  onChange={(e) => setEditUserForm({ ...editUserForm, fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>No. Telepon</Label>
                <Input
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Alamat</Label>
                <Input
                  value={editUserForm.address}
                  onChange={(e) => setEditUserForm({ ...editUserForm, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editUserForm.roleType}
                  onValueChange={(v) => setEditUserForm({ ...editUserForm, roleType: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESIDENT">Warga</SelectItem>
                    <SelectItem value="ADMIN">Ketua RT</SelectItem>
                    <SelectItem value="TREASURER">Bendahara</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Kelompok (RT)</Label>
                <Select
                  value={editUserForm.communityGroupId?.toString() || ""}
                  onValueChange={(v) =>
                    setEditUserForm({ ...editUserForm, communityGroupId: v ? Number(v) : undefined })
                  }
                >
                  <SelectTrigger><SelectValue placeholder="Pilih RT" /></SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        {g.name} ({g.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingUser(null)}>Batal</Button>
              <Button onClick={handleEditUser} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}    </div>
  );
}
