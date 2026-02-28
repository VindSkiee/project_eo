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
    Clock,
    Plus,
    Zap,
} from "lucide-react";
import { toast } from "sonner";
import { eventService } from "@/features/event/services/eventService";
import { userService } from "@/shared/services/userService";
import type { EventItem, UserItem } from "@/shared/types";
import type { EventStatusType } from "@/features/event/types";
import { DateRangeFilter } from "@/shared/components/DateRangeFilter";
import type { DateRange } from "@/shared/components/DateRangeFilter";
import {
    CreateEventDialog,
    EventsTable,
} from "@/features/event/components";

const PENDING_STATUSES: EventStatusType[] = ["SUBMITTED"];
const ACTIVE_STATUSES: EventStatusType[] = ["FUNDED", "ONGOING"];
const DONE_STATUSES: EventStatusType[] = ["COMPLETED", "SETTLED", "REJECTED", "CANCELLED"];

export default function EventsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState("semua");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Resolve event detail path based on current route
    const getEventDetailPath = (id: string) => {
        const path = location.pathname;
        if (path.includes("kegiatan-bendahara")) return `/dashboard/events-bendahara/${id}`;
        if (path.includes("kegiatan-rt")) return `/dashboard/events-rt/${id}`;
        if (path.includes("kegiatan-warga")) return `/dashboard/events-warga/${id}`;
        return `/dashboard/events/${id}`;
    };

    // Create Event Dialog
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [allUsers, setAllUsers] = useState<UserItem[]>([]);
    const [creatingEvent, setCreatingEvent] = useState(false);

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
            const res = await userService.getFiltered({ limit: 100 });

            // 1. Cek isi sebenarnya dari response API di console
            console.log("Data mentah dari API Users:", res);

            // 2. Pastikan yang dimasukkan ke state benar-benar sebuah Array
            if (Array.isArray(res)) {
                setAllUsers(res);
            } else {
                console.warn("Format data user tidak dikenali, diset ke array kosong:", res);
                setAllUsers([]);
            }
        } catch (error) {
            console.error("Gagal menarik data user:", error);
            setAllUsers([]); // Pastikan tetap array kosong jika gagal
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
        if (!matchSearch) return false;
        if (dateRange?.from) {
            const raw = e.startDate || e.createdAt;
            const d = new Date(raw);
            d.setHours(0, 0, 0, 0);
            const from = new Date(dateRange.from);
            from.setHours(0, 0, 0, 0);
            if (d < from) return false;
            if (dateRange.to) {
                const to = new Date(dateRange.to);
                to.setHours(23, 59, 59, 999);
                if (d > to) return false;
            }
        }
        if (activeTab === "semua") return true;
        if (activeTab === "menunggu") return PENDING_STATUSES.includes(e.status);
        if (activeTab === "berjalan") return ACTIVE_STATUSES.includes(e.status);
        if (activeTab === "selesai") return DONE_STATUSES.includes(e.status);
        if (activeTab === "draft") return e.status === "DRAFT";
        return true;
    });

    const pendingCount = events.filter((e) => PENDING_STATUSES.includes(e.status)).length;
    const activeCount = events.filter((e) => ACTIVE_STATUSES.includes(e.status)).length;

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
                {(() => {
                    try { const u = localStorage.getItem("user"); if (u && JSON.parse(u).role === "TREASURER") return null; } catch { } return (
                        <Button onClick={() => setShowCreateDialog(true)} className="shrink-0">
                            <Plus className="h-4 w-4 mr-1" /> Buat Acara Baru
                        </Button>
                    );
                })()}
            </div>

            {/* Summary Cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-3">
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
                            Berjalan
                        </CardTitle>
                        <Zap className="h-4 w-4 text-emerald-500" />
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
                    <div className="overflow-x-auto -mx-1 px-1 pb-0.5">
                        <TabsList className="w-max">
                            <TabsTrigger value="semua">Semua</TabsTrigger>
                            <TabsTrigger value="draft">Draft</TabsTrigger>
                            <TabsTrigger value="menunggu">
                                Menunggu {pendingCount > 0 && `(${pendingCount})`}
                            </TabsTrigger>
                            <TabsTrigger value="berjalan">Berjalan</TabsTrigger>
                            <TabsTrigger value="selesai">Selesai</TabsTrigger>
                        </TabsList>
                    </div>
                    <div className="flex gap-2 flex-wrap shrink-0">
                        <DateRangeFilter
                            value={dateRange}
                            onChange={setDateRange}
                            placeholder="Filter tanggal"
                        />
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
                </div>

                <TabsContent value={activeTab} className="mt-0 space-y-6">
                    <EventsTable
                        events={filteredEvents}
                        loading={loading}
                        searchQuery={search}
                        onEventClick={(id) => navigate(getEventDetailPath(id))}
                        currentUserId={(() => { try { const u = localStorage.getItem("user"); return u ? JSON.parse(u).id : undefined; } catch { return undefined; } })()}
                    />
                </TabsContent>
            </Tabs>

            {/* === Create Event Dialog === */}
            <CreateEventDialog
                open={showCreateDialog}
                onClose={() => setShowCreateDialog(false)}
                onSubmit={handleCreateEvent}
                allUsers={allUsers}
                submitting={creatingEvent}
            />
        </div>
    );
}
