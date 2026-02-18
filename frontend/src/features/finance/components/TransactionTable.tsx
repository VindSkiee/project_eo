import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { Badge } from "@/shared/ui/badge";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { Transaction } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx, idx) => (
            <TableRow key={tx.id}>
              <TableCell className="font-medium text-slate-500">
                {idx + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === "INCOME" || tx.type === "CREDIT"
                        ? "bg-emerald-100"
                        : "bg-red-100"
                    }`}
                  >
                    {tx.type === "INCOME" || tx.type === "CREDIT" ? (
                      <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {tx.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tx.createdBy?.fullName || "Sistem"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    tx.type === "INCOME" || tx.type === "CREDIT"
                      ? "default"
                      : "destructive"
                  }
                  className="text-[10px]"
                >
                  {tx.type === "INCOME" || tx.type === "CREDIT" ? "Masuk" : "Keluar"}
                </Badge>
              </TableCell>
              <TableCell
                className={`font-medium ${
                  tx.type === "INCOME" || tx.type === "CREDIT"
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {tx.type === "INCOME" || tx.type === "CREDIT" ? "+" : "-"}
                {formatRupiah(Math.abs(tx.amount))}
              </TableCell>
              <TableCell className="text-sm text-slate-500">
                {formatDateTime(tx.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
