import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Separator } from "@/shared/ui/separator";
import { ArrowLeft, XCircle } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/shared/services/userService";
import { loadCustomRoleLabels, getRoleLabel } from "@/shared/helpers/roleLabel";
import type { UserItem, Transaction } from "@/shared/types";
import {
  UserProfileCard,
  DuesStatusGrid,
  UserTransactionHistory,
  UserAdditionalInfo,
} from "@/features/profile/components";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [user, setUser] = useState<UserItem | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvedRoleLabel, setResolvedRoleLabel] = useState("");

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!id) return;
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      // Pastikan custom role label sudah termuat dari local storage
      await loadCustomRoleLabels();

      // Panggil backend: userService.getById seharusnya sudah memuat relasi 'payments' & 'contributions'
      const userData = await userService.getById(id!);
      setUser(userData);
      
      const resolvedType = userData.roleType || userData.role?.type || "";
      setResolvedRoleLabel(getRoleLabel(resolvedType));

      // Jika user adalah RESIDENT, mapping data pembayarannya ke bentuk Transaction
      if (resolvedType === "RESIDENT" && userData.paymentGatewayTxs && userData.paymentGatewayTxs.length > 0) {
        const mappedHistory: Transaction[] = userData.paymentGatewayTxs.map((p: any) => ({
          id: p.id,
          walletId: 0, // <--- TAMBAHKAN INI (Dummy ID agar TS tidak protes)
          description: `Pembayaran Iuran (Order: ${p.orderId || 'Sistem'})`,
          type: "CREDIT" as const, // <--- Gunakan 'as const' jika TS meminta union type 'CREDIT' | 'DEBIT'
          amount: Number(p.amount), 
          createdAt: p.createdAt,
        }));
        
        setTransactions(mappedHistory);
      } else {
        setTransactions([]);
      }
      
    } catch {
      toast.error("Gagal memuat data pengguna.");
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
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2 flex-1 w-full">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
        </Button>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <XCircle className="h-12 w-12 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Data pengguna tidak ditemukan.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userResolvedRole = user.roleType || user.role?.type || "";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
      </Button>

      {/* Profile Header */}
      <UserProfileCard user={user} roleLabel={resolvedRoleLabel} />

      {/* === RESIDENT-ONLY: Dues Grid & Transaction History === */}
      {userResolvedRole === "RESIDENT" && (
        <>
          <DuesStatusGrid
            targetYear={currentYear} // Menggunakan tahun berjalan otomatis
            createdAt={user.createdAt}          
            lastPaidPeriod={user.lastPaidPeriod} 
            contributions={user.contributions || []} 
          />
          <Separator />
          {/* Oper mapping transaksi yang bersih ke tabel */}
          <UserTransactionHistory transactions={transactions} />
        </>
      )}

      {/* === NON-RESIDENT: Only profile info === */}
      {userResolvedRole !== "RESIDENT" && (
        <UserAdditionalInfo user={user} roleLabel={resolvedRoleLabel} />
      )}
    </div>
  );
}