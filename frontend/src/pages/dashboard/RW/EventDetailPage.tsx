import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  dashboardService,
  type EventItem,
} from "@/services/dashboardService";

// === Helpers ===

const eventStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    DRAFT: "Draft",
    SUBMITTED: "Diajukan",
    UNDER_REVIEW: "Dalam Review",
    REJECTED: "Ditolak",
    APPROVED: "Disetujui",
    CANCELLED: "Dibatalkan",
    FUNDED: "Didanai",
    ONGOING: "Berlangsung",
    COMPLETED: "Selesai",
    SETTLED: "Diselesaikan",
  };
  return labels[status] || status;
};

const eventStatusVariant = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    DRAFT: "outline",
    SUBMITTED: "secondary",
    UNDER_REVIEW: "secondary",
    REJECTED: "destructive",
    APPROVED: "default",
    CANCELLED: "destructive",
    FUNDED: "default",
    ONGOING: "default",
    COMPLETED: "default",
    SETTLED: "default",
  };
  return variants[status] || "outline";
};

const participantRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    COMMITTEE: "Panitia",
    ATTENDEE: "Peserta",
    GUEST: "Tamu",
  };
  return labels[role] || role;
};

const approvalStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
  };
  return labels[status] || status;
};

const approvalStatusVariant = (status: string) => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    APPROVED: "default",
    REJECTED: "destructive",
  };
  return variants[status] || "outline";
};

function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Tidak ditentukan";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const eventData = await dashboardService.getEventById(id!);
      setEvent(eventData);
    } catch (error) {
      toast.error("Gagal memuat detail acara.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-8 w-40" />
        <Card>
          <CardContent className="py-8">
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Data acara tidak ditemukan.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const committeeMembers = event.participants?.filter(p => p.role === "COMMITTEE") || [];
  const totalExpenses = event.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const validExpenses = event.expenses?.filter(exp => exp.isValid) || [];
  const validExpensesTotal = validExpenses.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Daftar Acara
      </Button>

      {/* Event Header */}
      <Card>
        <CardContent className="py-6 sm:py-8">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-poppins">
                    {event.title}
                  </h1>
                  <Badge variant={eventStatusVariant(event.status)}>
                    {eventStatusLabel(event.status)}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">
                  <User className="inline h-4 w-4 mr-1" />
                  Dibuat oleh: <span className="font-medium">{event.createdBy?.fullName || "Tidak diketahui"}</span>
                </p>
              </div>
            </div>

            <Separator />

            {/* Event Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Estimasi Anggaran</p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatRupiah(event.budgetEstimated)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Anggaran Aktual</p>
                  <p className="text-sm font-bold text-slate-900">
                    {event.budgetActual ? formatRupiah(event.budgetActual) : "Belum diketahui"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Calendar className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Tanggal Mulai</p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatDate(event.startDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-orange-50">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Tanggal Selesai</p>
                  <p className="text-sm font-bold text-slate-900">
                    {formatDate(event.endDate)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Deskripsi Acara
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {event.description || "Tidak ada deskripsi."}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Committee/Participants */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Panitia ({committeeMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {committeeMembers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada panitia terdaftar.</p>
            ) : (
              <div className="space-y-2">
                {committeeMembers.map((participant, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        {participant.user.fullName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {participant.user.email}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {participantRoleLabel(participant.role)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!event.expenses || event.expenses.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">Belum ada pengeluaran tercatat.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div>
                    <p className="text-xs text-slate-500">Total Pengeluaran</p>
                    <p className="text-sm font-bold text-slate-900">{formatRupiah(totalExpenses)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Tervalidasi</p>
                    <p className="text-sm font-bold text-emerald-600">{formatRupiah(validExpensesTotal)}</p>
                  </div>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {event.expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                          {exp.title}
                          {exp.isValid ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Clock className="h-3 w-3 text-amber-500" />
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(exp.createdAt)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {formatRupiah(exp.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Approval Workflow */}
      {event.approvals && event.approvals.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Alur Persetujuan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Langkah</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Penyetuju</TableHead>
                    <TableHead>Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.approvals
                    .sort((a, b) => a.stepOrder - b.stepOrder)
                    .map((approval) => (
                      <TableRow key={approval.id}>
                        <TableCell className="font-medium">
                          {approval.stepOrder}
                        </TableCell>
                        <TableCell>{approval.roleSnapshot}</TableCell>
                        <TableCell>
                          <Badge variant={approvalStatusVariant(approval.status)}>
                            {approvalStatusLabel(approval.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {approval.approver?.fullName || "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {approval.notes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {event.statusHistory && event.statusHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Riwayat Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {event.statusHistory.map((history) => (
                <div
                  key={history.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-slate-50"
                >
                  <div className="p-2 rounded-full bg-white">
                    <AlertCircle className="h-4 w-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={eventStatusVariant(history.status)}>
                        {eventStatusLabel(history.status)}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {formatDateTime(history.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      Diperbarui oleh: <span className="font-medium">{history.changedBy.fullName}</span>
                    </p>
                    {history.reason && (
                      <p className="text-xs text-slate-600 mt-1 italic">
                        "{history.reason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
