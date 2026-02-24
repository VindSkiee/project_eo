import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { DataTable, type ColumnDef } from "@/shared/components/DataTable";
import { Shield, Search, Filter } from "lucide-react";
import { formatRupiah, formatDate } from "@/shared/helpers/formatters";
import type { Transaction } from "@/shared/types";

const columns: ColumnDef<Transaction>[] = [
  {
    key: "description",
    header: "Deskripsi",
    cellClassName: "text-sm text-slate-800 max-w-[180px] sm:max-w-md truncate",
    render: (tx) => tx.description || "-",
  },
  {
    key: "type",
    header: "Tipe",
    render: (tx) => (
      <Badge
        variant={tx.type === "CREDIT" ? "default" : "destructive"}
        className={`text-[10px] ${
          tx.type === "CREDIT"
            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none"
            : "bg-red-100 text-red-700 hover:bg-red-200 border-none"
        }`}
      >
        {tx.type === "CREDIT" ? "Pemasukan" : "Pengeluaran"}
      </Badge>
    ),
  },
  {
    key: "amount",
    header: "Jumlah",
    render: (tx) => (
      <span
        className={`font-medium whitespace-nowrap ${
          tx.type === "CREDIT" ? "text-emerald-600" : "text-red-600"
        }`}
      >
        {tx.type === "CREDIT" ? "+" : "-"}
        {formatRupiah(Number(tx.amount || 0))}
      </span>
    ),
  },
  {
    key: "date",
    header: "Tanggal",
    render: (tx) => (
      <span className="text-sm text-slate-500 whitespace-nowrap">
        {formatDate(tx.createdAt)}
      </span>
    ),
  },
];

interface UserTransactionHistoryProps {
  transactions?: Transaction[]; // Opsional agar tidak crash jika belum di-load
}

export function UserTransactionHistory({ transactions = [] }: UserTransactionHistoryProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CREDIT" | "DEBIT">("ALL");

  // Filter logika berjalan di sisi client
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Filter Pencarian Teks (Deskripsi)
      const matchesSearch = (tx.description || "")
        .toLowerCase()
        .includes(search.toLowerCase());

      // 2. Filter Tipe Transaksi
      const matchesType = typeFilter === "ALL" || tx.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <CardTitle className="text-base sm:text-lg font-poppins">
          Riwayat Transaksi
        </CardTitle>

        {/* --- Kontrol Filter & Search --- */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Input Pencarian */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Cari deskripsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm w-full"
            />
          </div>

          {/* Select Filter Tipe */}
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
            <SelectTrigger className="h-9 w-full sm:w-[150px] text-sm shrink-0">
              <Filter className="h-4 w-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              <SelectItem value="CREDIT">Pemasukan (+)</SelectItem>
              <SelectItem value="DEBIT">Pengeluaran (-)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <DataTable
          columns={columns}
          data={filteredTransactions}
          keyExtractor={(tx) => tx.id}
          showRowNumber
          rowNumberPadded
          emptyIcon={Shield}
          emptyTitle={
            search || typeFilter !== "ALL"
              ? "Tidak ada transaksi yang cocok dengan filter."
              : "Belum ada transaksi untuk warga ini."
          }
        />
      </CardContent>
    </Card>
  );
}