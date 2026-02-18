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
import { Shield } from "lucide-react";
import type { Transaction } from "@/shared/types";

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface UserTransactionHistoryProps {
  transactions: Transaction[];
}

export function UserTransactionHistory({ transactions }: UserTransactionHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg font-poppins">
          Riwayat Transaksi
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Shield className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">Belum ada transaksi untuk warga ini.</p>
          </div>
        ) : (
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
                    <TableCell className="text-slate-500">{idx + 1}</TableCell>
                    <TableCell className="text-sm text-slate-800 max-w-[200px] truncate">
                      {tx.description}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={tx.type === "CREDIT" ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {tx.type === "CREDIT" ? "Masuk" : "Keluar"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`font-medium ${tx.type === "CREDIT" ? "text-emerald-600" : "text-red-600"}`}>
                      {tx.type === "CREDIT" ? "+" : "-"}{formatRupiah(Number(tx.amount))}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {new Date(tx.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
