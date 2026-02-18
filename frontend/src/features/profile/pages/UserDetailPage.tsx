import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Separator } from "@/shared/ui/separator";
import { ArrowLeft, XCircle } from "lucide-react";
import { toast } from "sonner";
import { userService } from "@/shared/services/userService";
import { financeService } from "@/features/finance/services/financeService";
import type { UserItem, Transaction } from "@/shared/types";
import {
  UserProfileCard,
  DuesStatusGrid,
  UserTransactionHistory,
  UserAdditionalInfo,
} from "@/features/profile/components";

// Helpers moved to components

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserItem | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!id) return;
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    setLoading(true);
    try {
      const userData = await userService.getById(id!);
      setUser(userData);

      // If RESIDENT, also fetch transactions
      if (userData.roleType === "RESIDENT") {
        try {
          const txns = await financeService.getTransparencyHistory("RT");
          // Filter transactions that relate to this user (by description or contributorUserId)
          setTransactions(txns);
        } catch {
          // Transactions may fail for role reasons - non-critical
        }
      }
    } catch {
      toast.error("Gagal memuat data pengguna.");
    } finally {
      setLoading(false);
    }
  };

  // Determine which months have been paid (DUES/CREDIT transactions with the user's name)
  const paidMonths = new Set<number>();
  if (user?.roleType === "RESIDENT") {
    transactions.forEach((tx) => {
      const txDate = new Date(tx.createdAt);
      if (
        txDate.getFullYear() === currentYear &&
        tx.type === "CREDIT" &&
        tx.description?.toLowerCase().includes("iuran")
      ) {
        // Check if this transaction mentions the user's name
        if (
          tx.description?.includes(user.fullName) ||
          tx.createdBy?.fullName === user.fullName
        ) {
          paidMonths.add(txDate.getMonth());
        }
      }
    });
  }

  // User's recent transactions
  const userTransactions = transactions.filter(
    (tx) =>
      tx.createdBy?.fullName === user?.fullName ||
      tx.description?.includes(user?.fullName || "___NONE___")
  ).slice(0, 10);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Kembali
      </Button>

      {/* Profile Header */}
      <UserProfileCard user={user} />

      {/* === RESIDENT-ONLY: Dues Grid & Transaction History === */}
      {user.roleType === "RESIDENT" && (
        <>
          <DuesStatusGrid paidMonths={paidMonths} currentYear={currentYear} />
          <Separator />
          <UserTransactionHistory transactions={userTransactions} />
        </>
      )}

      {/* === NON-RESIDENT: Only profile info === */}
      {user.roleType !== "RESIDENT" && (
        <UserAdditionalInfo user={user} />
      )}
    </div>
  );
}
