import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Input } from "@/shared/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import {
    CalendarDays,
    Search,
    CheckCircle2,
    Clock,
    Plus,
} from "lucide-react";
import { toast } from "sonner";
import { eventService } from "@/features/event/services/eventService";
import { userService } from "@/shared/services/userService";
import type { EventItem, UserItem } from "@/shared/types";
import {
    CreateEventDialog,
    EditEventDialog,
    ApprovalDialog,
    EventsTable,
} from "@/features/event/components";

export default function EventsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("semua");

    // Resolve event detail path based on current route
    const getEventDetailPath = (id: string) => {
        const path = location.pathname;
        if (path.includes("kegiatan-bendahara")) return `/dashboard/events-bendahara/${id}`;
        if (path.includes("kegiatan-rt")) return `/dashboard/events-rt/${id}`;
        if (path.includes("kegiatan-warga")) return `/dashboard/events-warga/${id}`;
        return `/dashboard/events/${id}`;
    };

    // Approval Dialog
    const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
    const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
    const [approvalNotes, setApprovalNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Create Event Dialog
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [allUsers, setAllUsers] = useState<UserItem[]>([]);
    const [creatingEvent, setCreatingEvent] = useState(false);

    // Edit Event Dialog
    const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
    const [editingEventSubmitting, setEditingEventSubmitting] = useState(false);

    useEffect(() => {
        fetchEvents();
        fetchAllUsers();
    }, []);

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const data = await eventService.getAll();
            setEvents(data);
        } catch {
            toast.error("Gagal memuat data kegiatan.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await userService.getFiltered({ limit: 200 });
            setAllUsers(res.data);
        } catch {
            // Non-critical
        }
    };

    // === Create Event ===
    const handleCreateEvent = async (data: { title: string; description: string; budgetEstimated: number; startDate?: string; endDate?: string; committeeUserIds?: string[] }) => {
        setCreatingEvent(true);
        try {
            await eventService.create({ data, committeeUserIds: data.committeeUserIds });
            toast.success("Kegiatan berhasil dibuat!");
            setShowCreateDialog(false);
            fetchEvents();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message || "Gagal membuat kegiatan.");
        } finally {
            setCreatingEvent(false);
        }
    };

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
            await eventService.processApproval(selectedEvent.id, {
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
            await eventService.cancel(event.id);
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
    };

    const handleEditEvent = async (eventId: string, payload: Parameters<typeof eventService.update>[1]) => {
        setEditingEventSubmitting(true);
        try {
            await eventService.update(eventId, payload);
            toast.success("Kegiatan berhasil diperbarui!");
            setEditingEvent(null);
            fetchEvents();
        } catch (err: unknown) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
            toast.error(message || "Gagal memperbarui kegiatan.");
        } finally {
            setEditingEventSubmitting(false);
        }
    };

    // === Handle Delete Event ===
    const handleDeleteEvent = async (event: EventItem) => {
        if (!confirm(`Yakin ingin menghapus kegiatan "${event.title}"? Aksi ini tidak dapat dibatalkan.`)) return;
        try {
            await eventService.delete(event.id);
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
                {(() => { try { const u = localStorage.getItem("user"); if (u && JSON.parse(u).role === "TREASURER") return null; } catch {} return (
                  <Button onClick={() => setShowCreateDialog(true)} className="shrink-0">
                      <Plus className="h-4 w-4 mr-1" /> Buat Acara Baru
                  </Button>
                ); })()}
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
                    <EventsTable
                        events={filteredEvents}
                        loading={loading}
                        searchQuery={search}
                        onEventClick={(id) => navigate(getEventDetailPath(id))}
                        onEdit={openEditDialog}
                        onDelete={handleDeleteEvent}
                        onApprove={(event) => openApprovalDialog(event, "approve")}
                        onReject={(event) => openApprovalDialog(event, "reject")}
                        onCancel={handleCancel}
                    />
                </TabsContent>
            </Tabs>

            {/* === Approval Dialog === */}
            {selectedEvent && approvalAction && (
                <ApprovalDialog
                    event={selectedEvent}
                    action={approvalAction}
                    onClose={() => {
                        setSelectedEvent(null);
                        setApprovalAction(null);
                        setApprovalNotes("");
                    }}
                    onSubmit={handleApproval}
                    notes={approvalNotes}
                    onNotesChange={setApprovalNotes}
                    submitting={submitting}
                />
            )}

            {/* === Create Event Dialog === */}
            <CreateEventDialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onSubmit={handleCreateEvent}
                allUsers={allUsers}
                submitting={creatingEvent}
            />

            {/* === Edit Event Dialog === */}
            {editingEvent && (
                <EditEventDialog
                    event={editingEvent}
                    onClose={() => setEditingEvent(null)}
                    onSubmit={(data) => handleEditEvent(editingEvent.id, data)}
                    submitting={editingEventSubmitting}
                />
            )}
        </div>
    );
}
