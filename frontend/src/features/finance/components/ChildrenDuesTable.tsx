import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { AlertCircle, Building2 } from "lucide-react";
import type { GroupDuesInfo } from "@/features/finance/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ChildrenDuesTableProps {
  children: GroupDuesInfo[];
}

export function ChildrenDuesTable({ children }: ChildrenDuesTableProps) {
  if (children.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-poppins">
          <Building2 className="h-5 w-5 text-primary" />
          Iuran Grup Anak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Grup</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-center">Jatuh Tempo</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {children.map((child) => (
                <TableRow key={child.group.id}>
                  <TableCell className="font-medium">{child.group.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {child.group.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {child.duesRule
                      ? formatRupiah(child.duesRule.amount)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {child.duesRule
                      ? `Tgl ${child.duesRule.dueDay}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    {child.duesRule ? (
                      <Badge
                        variant={child.duesRule.isActive ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {child.duesRule.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                        <AlertCircle className="h-3 w-3" />
                        Belum diatur
                      </span>
                    )}
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
