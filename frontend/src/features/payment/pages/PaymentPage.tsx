import { useEffect, useState } from "react";
import { Input } from "@/shared/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { paymentService } from "@/features/payment/services/paymentService";
import type { PaymentItem } from "@/shared/types";
import { PaymentSummaryCards, PaymentTable } from "@/features/payment/components";

// Helpers moved to components

export default function PaymentPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [processingRefund, setProcessingRefund] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.getAll();
      setPayments(data);
    } catch {
      toast.error("Gagal memuat data pembayaran.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.orderId.toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.user?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const paidCount = payments.filter((p) => p.status === "PAID").length;
  const pendingCount = payments.filter((p) => p.status === "PENDING").length;
  const totalPaid = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  // === Handle Process Refund ===
  const handleProcessRefund = async (refundId: string) => {
    if (!confirm("Proses refund untuk transaksi ini?")) return;
    setProcessingRefund(refundId);
    try {
      await paymentService.processRefund(refundId);
      toast.success("Refund berhasil diproses.");
      fetchPayments();
    } catch {
      toast.error("Gagal memproses refund.");
    } finally {
      setProcessingRefund(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
          Pembayaran
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Riwayat seluruh pembayaran warga melalui payment gateway.
        </p>
      </div>

      {/* Summary Cards */}
      <PaymentSummaryCards
        totalCount={payments.length}
        paidCount={paidCount}
        pendingCount={pendingCount}
        totalPaid={totalPaid}
        loading={loading}
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Cari order ID, nama, atau email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <PaymentTable
        payments={filteredPayments}
        loading={loading}
        search={search}
        processingRefund={processingRefund}
        onProcessRefund={handleProcessRefund}
      />
    </div>
  );
}
