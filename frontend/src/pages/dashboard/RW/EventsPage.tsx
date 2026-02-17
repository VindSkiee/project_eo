import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    CalendarDays,
    Search,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    Ban,
    Plus,
    CalendarIcon,
    ExternalLink,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { dashboardService, type EventItem, type UserItem } from "@/services/dashboardService";

// === HELPERS ===

function formatRupiah(amount: number | string): string {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num || 0);
}

function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

type StatusKey = "PENDING_APPROVAL" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "REJECTED";

const statusConfig: Record<StatusKey, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    PENDING_APPROVAL: { label: "Menunggu", variant: "secondary" },
    APPROVED: { label: "Disetujui", variant: "default" },
    IN_PROGRESS: { label: "Berjalan", variant: "default" },
    COMPLETED: { label: "Selesai", variant: "outline" },
    CANCELLED: { label: "Dibatalkan", variant: "destructive" },
    REJECTED: { label: "Ditolak", variant: "destructive" },
};

export default function EventsPage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("semua");

    // Approval Dialog
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
    const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
    const [approvalNotes, setApprovalNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Create Event Dialog
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [createForm, setCreateForm] = useState({
        title: "",
        description: "",
        budgetEstimated: "",
    });
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(undefined);
    const [committeeUserIds, setCommitteeUserIds] = useState<string[]>([]);
    const [allUsers, setAllUsers] = useState<UserItem[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [creatingEvent, setCreatingEvent] = useState(false);

    // Edit Event Dialog
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        budgetEstimated: "",
    });
    const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
    const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
    const [updatingEvent, setUpdatingEvent] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchAllUsers();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await dashboardService.getEvents();
            setEvents(data);
        } catch {
            toast.error("Gagal memuat data kegiatan.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await dashboardService.getUsersFiltered({ limit: 200 });
            setAllUsers(res.data);
        } catch {
            // Non-critical
        }
    };

    // === Create Event ===
    const resetCreateForm = () => {
        setCreateForm({ title: "", description: "", budgetEstimated: "" });
        setStartDate(undefined);
        setEndDate(undefined);
        setCommitteeUserIds([]);
        setUserSearch("");
    };

    const handleCreateEvent = async () => {
        if (!createForm.title.trim()) {
            toast.error("Judul kegiatan wajib diisi.");
            return;
        }
        if (!createForm.description.trim()) {
            toast.error("Deskripsi kegiatan wajib diisi.");
            return;
        }
        const budget = parseFloat(createForm.budgetEstimated.replace(/\D/g, ""));
        if (!budget || budget <= 0) {
            toast.error("Estimasi anggaran harus lebih dari 0.");
            return;
        }
        setCreatingEvent(true);
        try {
            await dashboardService.createEvent({
                data: {
                    title: createForm.title.trim(),
                    description: createForm.description.trim(),
                    budgetEstimated: budget,
                    startDate: startDate?.toISOString(),
                    endDate: endDate?.toISOString(),
                },
                committeeUserIds: committeeUserIds.length > 0 ? committeeUserIds : undefined,
            });
            toast.success("Kegiatan berhasil dibuat!");
            setShowCreateDialog(false);
            resetCreateForm();
            fetchEvents();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message || "Gagal membuat kegiatan.");
        } finally {
            setCreatingEvent(false);
        }
    };

    const toggleCommitteeMember = (userId: string) => {
        setCommitteeUserIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const filteredUsers = allUsers.filter(
        (u) =>
            u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase())
    );

    // Filtered events
    const filteredEvents = events.filter((e) => {
        const matchSearch =
            e.title.toLowerCase().includes(search.toLowerCase()) ||
            e.description.toLowerCase().includes(search.toLowerCase());
        if (activeTab === "semua") return matchSearch;
        if (activeTab === "menunggu") return matchSearch && e.status === "PENDING_APPROVAL";
        if (activeTab === "aktif") return matchSearch && (e.status === "APPROVED" || e.status === "IN_PROGRESS");
        if (activeTab === "selesai") return matchSearch && (e.status === "COMPLETED" || e.status === "CANCELLED" || e.status === "REJECTED");
        return matchSearch;
    });

    const pendingCount = events.filter((e) => e.status === "PENDING_APPROVAL").length;
    const activeCount = events.filter((e) => e.status === "APPROVED" || e.status === "IN_PROGRESS").length;

    // === Handle Approval ===
    const handleApproval = async () => {
        if (!selectedEvent || !approvalAction) return;
        setSubmitting(true);
        try {
            await dashboardService.processEventApproval(selectedEvent.id, {
                status: approvalAction === "approve" ? "APPROVED" : "REJECTED",
                notes: approvalNotes || undefined,
            });
            toast.success(
                approvalAction === "approve"
                    ? "Kegiatan berhasil disetujui!"
                    : "Kegiatan berhasil ditolak."
            );
            setSelectedEvent(null);
            setApprovalAction(null);
            setApprovalNotes("");
            fetchEvents();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message || "Gagal memproses persetujuan.");
        } finally {
            setSubmitting(false);
        }
    };

    // === Handle Cancel ===
    const handleCancel = async (event: EventItem) => {
        if (!confirm(`Yakin ingin membatalkan kegiatan "${event.title}"?`)) return;
        try {
            await dashboardService.cancelEvent(event.id);
            toast.success("Kegiatan berhasil dibatalkan.");
            fetchEvents();
        } catch {
            toast.error("Gagal membatalkan kegiatan.");
        }
    };

    const openApprovalDialog = (event: EventItem, action: "approve" | "reject") => {
        setSelectedEvent(event);
        setApprovalAction(action);
        setApprovalNotes("");
    };

    // === Handle Edit Event ===
    const openEditDialog = (event: EventItem) => {
        setEditingEvent(event);
        setEditForm({
            title: event.title,
            description: event.description,
            budgetEstimated: new Intl.NumberFormat("id-ID").format(parseFloat(event.budgetEstimated)),
        });
        setEditStartDate(event.startDate ? new Date(event.startDate) : undefined);
        setEditEndDate(event.endDate ? new Date(event.endDate) : undefined);
    };

    const handleEditEvent = async () => {
        if (!editingEvent) return;
        if (!editForm.title.trim()) {
            toast.error("Judul kegiatan wajib diisi.");
            return;
        }
        if (!editForm.description.trim()) {
            toast.error("Deskripsi kegiatan wajib diisi.");
            return;
        }
        const budget = parseFloat(editForm.budgetEstimated.replace(/\D/g, ""));
        if (!budget || budget <= 0) {
            toast.error("Estimasi anggaran harus lebih dari 0.");
            return;
        }
        setUpdatingEvent(true);
        try {
            await dashboardService.updateEvent(editingEvent.id, {
                title: editForm.title.trim(),
                description: editForm.description.trim(),
                budgetEstimated: budget,
                startDate: editStartDate?.toISOString(),
                endDate: editEndDate?.toISOString(),
            });
            toast.success("Kegiatan berhasil diperbarui!");
            setEditingEvent(null);
            fetchEvents();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message || "Gagal memperbarui kegiatan.");
        } finally {
            setUpdatingEvent(false);
        }
    };

    // === Handle Delete Event ===
    const handleDeleteEvent = async (event: EventItem) => {
        if (!confirm(`Yakin ingin menghapus kegiatan "${event.title}"? Aksi ini tidak dapat dibatalkan.`)) return;
        try {
            await dashboardService.deleteEvent(event.id);
            toast.success("Kegiatan berhasil dihapus.");
            fetchEvents();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message || "Gagal menghapus kegiatan.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
                        Kegiatan
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500 mt-1">
                        Kelola seluruh kegiatan dan acara lingkungan.
                    </p>
                </div>
                <Button onClick={() => setShowCreateDialog(true)} className="shrink-0">
                    <Plus className="h-4 w-4 mr-1" /> Buat Acara Baru
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
                            Total
                        </CardTitle>
                        <CalendarDays className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-12" /> : (
                            <div className="text-2xl font-bold text-slate-900">{events.length}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
                            Menunggu
                        </CardTitle>
                        <Clock className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-12" /> : (
                            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 font-poppins">
                            Aktif
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-8 w-12" /> : (
                            <div className="text-2xl font-bold text-emerald-600">{activeCount}</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tabs + Search */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <TabsList>
                        <TabsTrigger value="semua">Semua</TabsTrigger>
                        <TabsTrigger value="menunggu">
                            Menunggu {pendingCount > 0 && `(${pendingCount})`}
                        </TabsTrigger>
                        <TabsTrigger value="aktif">Aktif</TabsTrigger>
                        <TabsTrigger value="selesai">Selesai</TabsTrigger>
                    </TabsList>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Cari kegiatan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <TabsContent value={activeTab} className="mt-0 space-y-6">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                            <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                <CalendarDays className="h-6 w-6 text-slate-400" />
                            </div>
                            <p className="text-sm font-medium text-slate-600">
                                {search ? "Kegiatan tidak ditemukan" : "Belum ada kegiatan"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {search ? "Coba gunakan kata kunci lain" : "Buat kegiatan baru untuk memulai"}
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
                                                Judul
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Pengaju
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Anggaran
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                                                Tanggal
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
                                        {filteredEvents.map((event, idx) => {
                                            const sc = statusConfig[event.status as StatusKey] || {
                                                label: event.status,
                                                variant: "outline" as const,
                                            };
                                            return (
                                                <tr
                                                    key={event.id}
                                                    className="group hover:bg-slate-50/80 transition-all duration-200 cursor-pointer"
                                                    onClick={() => navigate(`/dashboard/events/${event.id}`)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="text-sm text-slate-400 font-mono">
                                                            {(idx + 1).toString().padStart(2, '0')}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div className="flex flex-col items-center">
                                                            <p className="font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                                                                {event.title}
                                                            </p>
                                                            <p className="text-xs text-slate-400 truncate max-w-[200px] mt-0.5 text-center">
                                                                {event.description}
                                                            </p>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="text-sm text-slate-600">
                                                            {event.createdBy?.fullName || "—"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="text-sm font-medium text-slate-700">
                                                            {formatRupiah(event.budgetEstimated)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className="text-sm text-slate-500">
                                                            {formatDate(event.startDate)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <span className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${event.status === "APPROVED"
                                                                ? "bg-emerald-50 text-emerald-700"
                                                                : event.status === "PENDING_APPROVAL"
                                                                    ? "bg-amber-50 text-amber-700"
                                                                    : event.status === "IN_PROGRESS"
                                                                        ? "bg-blue-50 text-blue-700"
                                                                        : event.status === "COMPLETED"
                                                                            ? "bg-slate-50 text-slate-600"
                                                                            : event.status === "CANCELLED"
                                                                                ? "bg-rose-50 text-rose-700"
                                                                                : event.status === "REJECTED"
                                                                                    ? "bg-red-50 text-red-700"
                                                                                    : "bg-slate-50 text-slate-600"
                                                            }`}>
                                                            {sc.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <div
                                                            className="flex items-center justify-center gap-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {event.status === "DRAFT" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => openEditDialog(event)}
                                                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-blue-500 transition-all duration-200"
                                                                        title="Edit"
                                                                    >
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteEvent(event)}
                                                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                                                                        title="Hapus"
                                                                    >
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {event.status === "PENDING_APPROVAL" && (
                                                                <>
                                                                    <button
                                                                        onClick={() => openApprovalDialog(event, "approve")}
                                                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-emerald-500 transition-all duration-200"
                                                                        title="Setujui"
                                                                    >
                                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => openApprovalDialog(event, "reject")}
                                                                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                                                                        title="Tolak"
                                                                    >
                                                                        <XCircle className="h-3.5 w-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {(event.status === "APPROVED" || event.status === "IN_PROGRESS") && (
                                                                <button
                                                                    onClick={() => handleCancel(event)}
                                                                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-rose-500 transition-all duration-200"
                                                                    title="Batalkan"
                                                                >
                                                                    <Ban className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
                                                            {!["DRAFT", "PENDING_APPROVAL", "APPROVED", "IN_PROGRESS"].includes(event.status) && (
                                                                <button
                                                                    onClick={() => navigate(`/dashboard/events/${event.id}`)}
                                                                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-500 transition-all duration-200"
                                                                    title="Lihat Detail"
                                                                >
                                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                                </button>
                                                            )}
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
                                Menampilkan {filteredEvents.length} kegiatan
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* === Approval Dialog === */}
            <Dialog
                open={!!selectedEvent && !!approvalAction}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedEvent(null);
                        setApprovalAction(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="font-poppins">
                            {approvalAction === "approve" ? "Setujui Kegiatan" : "Tolak Kegiatan"}
                        </DialogTitle>
                        <DialogDescription>
                            {approvalAction === "approve"
                                ? `Anda akan menyetujui kegiatan "${selectedEvent?.title}".`
                                : `Anda akan menolak kegiatan "${selectedEvent?.title}".`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {selectedEvent && (
                            <div className="rounded-lg bg-slate-50 p-3 space-y-1.5">
                                <p className="text-sm font-medium text-slate-900">
                                    {selectedEvent.title}
                                </p>
                                <p className="text-xs text-slate-500">{selectedEvent.description}</p>
                                <p className="text-xs text-slate-500">
                                    Anggaran: {formatRupiah(selectedEvent.budgetEstimated)}
                                </p>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="approval-notes">
                                Catatan {approvalAction === "reject" ? "*" : "(opsional)"}
                            </Label>
                            <Textarea
                                id="approval-notes"
                                placeholder={
                                    approvalAction === "approve"
                                        ? "Catatan tambahan (opsional)..."
                                        : "Alasan penolakan..."
                                }
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setSelectedEvent(null);
                                setApprovalAction(null);
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={handleApproval}
                            disabled={submitting}
                            variant={approvalAction === "approve" ? "default" : "destructive"}
                        >
                            {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            {approvalAction === "approve" ? "Setujui" : "Tolak"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* === Create Event Dialog === */}
            <Dialog open={showCreateDialog} onOpenChange={(open) => { if (!open) { setShowCreateDialog(false); resetCreateForm(); } }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-poppins">Buat Acara Baru</DialogTitle>
                        <DialogDescription>
                            Isi detail kegiatan yang ingin diajukan.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="event-title">Judul Kegiatan *</Label>
                            <Input
                                id="event-title"
                                placeholder="Contoh: Kerja Bakti Lingkungan"
                                value={createForm.title}
                                onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="event-desc">Deskripsi *</Label>
                            <Textarea
                                id="event-desc"
                                placeholder="Jelaskan detail kegiatan..."
                                value={createForm.description}
                                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <Label htmlFor="event-budget">Estimasi Anggaran (IDR) *</Label>
                            <Input
                                id="event-budget"
                                placeholder="500000"
                                value={createForm.budgetEstimated}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "");
                                    setCreateForm((f) => ({
                                        ...f,
                                        budgetEstimated: raw ? new Intl.NumberFormat("id-ID").format(Number(raw)) : "",
                                    }));
                                }}
                            />
                            {createForm.budgetEstimated && (
                                <p className="text-xs text-slate-500">
                                    {formatRupiah(Number(createForm.budgetEstimated.replace(/\D/g, "")))}
                                </p>
                            )}
                        </div>

                        {/* Date pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Start Date */}
                            <div className="space-y-2">
                                <Label>Tanggal Mulai</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "dd MMM yyyy", { locale: idLocale }) : "Pilih tanggal"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div className="space-y-2">
                                <Label>Tanggal Selesai</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {endDate ? format(endDate, "dd MMM yyyy", { locale: idLocale }) : "Pilih tanggal"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={endDate}
                                            onSelect={setEndDate}
                                            disabled={(date) => startDate ? date < startDate : false}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Committee Members */}
                        <div className="space-y-2">
                            <Label>Panitia / Anggota Komite</Label>
                            <Input
                                placeholder="Cari anggota..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="mb-2"
                            />
                            <ScrollArea className="h-40 rounded-md border p-2">
                                {filteredUsers.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-4">Tidak ada pengguna ditemukan.</p>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <label
                                            key={u.id}
                                            className="flex items-center gap-2 py-1.5 px-1 rounded hover:bg-slate-50 cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={committeeUserIds.includes(u.id)}
                                                onCheckedChange={() => toggleCommitteeMember(u.id)}
                                            />
                                            <span className="text-sm text-slate-800">{u.fullName}</span>
                                            <span className="text-xs text-slate-400 ml-auto">{u.email}</span>
                                        </label>
                                    ))
                                )}
                            </ScrollArea>
                            {committeeUserIds.length > 0 && (
                                <p className="text-xs text-slate-500">
                                    {committeeUserIds.length} anggota dipilih
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetCreateForm(); }}>
                            Batal
                        </Button>
                        <Button onClick={handleCreateEvent} disabled={creatingEvent}>
                            {creatingEvent && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            Buat Kegiatan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* === Edit Event Dialog === */}
            <Dialog open={!!editingEvent} onOpenChange={(open) => { if (!open) { setEditingEvent(null); } }}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-poppins">Edit Kegiatan</DialogTitle>
                        <DialogDescription>
                            Perbarui detail kegiatan. Hanya dapat diedit jika status masih DRAFT.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-event-title">Judul Kegiatan *</Label>
                            <Input
                                id="edit-event-title"
                                placeholder="Contoh: Kerja Bakti Lingkungan"
                                value={editForm.title}
                                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-event-desc">Deskripsi *</Label>
                            <Textarea
                                id="edit-event-desc"
                                placeholder="Jelaskan detail kegiatan..."
                                value={editForm.description}
                                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        {/* Budget */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-event-budget">Estimasi Anggaran (IDR) *</Label>
                            <Input
                                id="edit-event-budget"
                                placeholder="500000"
                                value={editForm.budgetEstimated}
                                onChange={(e) => {
                                    const raw = e.target.value.replace(/\D/g, "");
                                    setEditForm((f) => ({
                                        ...f,
                                        budgetEstimated: raw ? new Intl.NumberFormat("id-ID").format(Number(raw)) : "",
                                    }));
                                }}
                            />
                            {editForm.budgetEstimated && (
                                <p className="text-xs text-slate-500">
                                    {formatRupiah(Number(editForm.budgetEstimated.replace(/\D/g, "")))}
                                </p>
                            )}
                        </div>

                        {/* Date pickers */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Start Date */}
                            <div className="space-y-2">
                                <Label>Tanggal Mulai</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {editStartDate ? format(editStartDate, "dd MMM yyyy", { locale: idLocale }) : "Pilih tanggal"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={editStartDate}
                                            onSelect={setEditStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* End Date */}
                            <div className="space-y-2">
                                <Label>Tanggal Selesai</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {editEndDate ? format(editEndDate, "dd MMM yyyy", { locale: idLocale }) : "Pilih tanggal"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={editEndDate}
                                            onSelect={setEditEndDate}
                                            disabled={(date) => editStartDate ? date < editStartDate : false}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setEditingEvent(null); }}>
                            Batal
                        </Button>
                        <Button onClick={handleEditEvent} disabled={updatingEvent}>
                            {updatingEvent && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                            Simpan Perubahan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
