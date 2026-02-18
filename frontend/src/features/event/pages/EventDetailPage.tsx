import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { ArrowLeft, XCircle, FileText } from "lucide-react";
import { toast } from "sonner";
import { eventService } from "@/features/event/services/eventService";
import type { EventItem } from "@/shared/types";
import {
  EventHeader,
  CommitteeList,
  ExpensesSummary,
  ApprovalWorkflow,
  StatusHistory,
} from "@/features/event/components";

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
      const eventData = await eventService.getById(id!);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Kembali ke Daftar Acara
      </Button>

      {/* Event Header */}
      <EventHeader event={event} />

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
        <CommitteeList event={event} />
        <ExpensesSummary event={event} />
      </div>

      <ApprovalWorkflow event={event} />
      <StatusHistory event={event} />
    </div>
  );
}
