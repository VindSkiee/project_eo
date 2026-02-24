import { DataTable, type ColumnDef } from "@/shared/components/DataTable";
import { Badge } from "@/shared/ui/badge";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { formatRupiah, formatDateTime } from "@/shared/helpers/formatters";
import type { Transaction } from "@/shared/types";

function isIncome(tx: Transaction) {
  return tx.type === "INCOME" || tx.type === "CREDIT";
}

const columns: ColumnDef<Transaction>[] = [
  {
    key: "description",
    header: "Deskripsi",
    render: (tx) => (
      <div className="flex items-center gap-2">
        <div
          className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
            isIncome(tx) ? "bg-emerald-100" : "bg-red-100"
          }`}
        >
          {isIncome(tx) ? (
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          ) : (
            <ArrowUpRight className="h-4 w-4 text-red-600" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">{tx.description}</p>
          <p className="text-xs text-slate-500">
            {tx.createdBy?.fullName || "Sistem"}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "type",
    header: "Tipe",
    render: (tx) => (
      <Badge
        variant={isIncome(tx) ? "default" : "destructive"}
        className="text-[10px]"
      >
        {isIncome(tx) ? "Masuk" : "Keluar"}
      </Badge>
    ),
  },
  {
    key: "amount",
    header: "Jumlah",
    render: (tx) => (
      <span
        className={`font-medium ${
          isIncome(tx) ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {isIncome(tx) ? "+" : "-"}
        {formatRupiah(Math.abs(tx.amount))}
      </span>
    ),
  },
  {
    key: "date",
    header: "Tanggal",
    render: (tx) => (
      <span className="text-sm text-slate-500">{formatDateTime(tx.createdAt)}</span>
    ),
  },
];

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  return (
    <DataTable
      columns={columns}
      data={transactions}
      keyExtractor={(tx) => tx.id}
      showRowNumber
      rowNumberPadded
    />
  );
}
