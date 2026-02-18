import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { CheckCircle2 } from "lucide-react";
import type { EventItem } from "@/shared/types";

const approvalStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    APPROVED: "Disetujui",
    REJECTED: "Ditolak",
  };
  return labels[status] || status;
};

const approvalStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    APPROVED: "default",
    REJECTED: "destructive",
  };
  return variants[status] || "outline";
};

interface ApprovalWorkflowProps {
  event: EventItem;
}

export function ApprovalWorkflow({ event }: ApprovalWorkflowProps) {
  if (!event.approvals || event.approvals.length === 0) {
    return null;
  }

  return (
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
                    <TableCell className="font-medium">{approval.stepOrder}</TableCell>
                    <TableCell>{approval.roleSnapshot}</TableCell>
                    <TableCell>
                      <Badge variant={approvalStatusVariant(approval.status)}>
                        {approvalStatusLabel(approval.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{approval.approver?.fullName || "-"}</TableCell>
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
  );
}
