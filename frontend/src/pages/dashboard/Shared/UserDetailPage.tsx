import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Building2,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  dashboardService,
  type UserItem,
  type Transaction,
} from "@/services/dashboardService";

// === Helpers ===

const roleLabel = (roleType: string) => {
  switch (roleType) {
    case "LEADER": return "Ketua RW";
    case "ADMIN": return "Ketua RT";
    case "TREASURER": return "Bendahara";
    default: return "Warga";
  }
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agt", "Sep", "Okt", "Nov", "Des",
];

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
      const userData = await dashboardService.getUserById(id!);
      setUser(userData);

      // If RESIDENT, also fetch transactions
      if (userData.roleType === "RESIDENT") {
        try {
          const txns = await dashboardService.getTransparencyHistory("RT");
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
      <Card>
        <CardContent className="py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <Avatar className="h-20 w-20 border-2 border-primary/10 shadow-md">
              <AvatarFallback className="bg-primary/5 text-primary font-bold text-2xl font-poppins">
                {user.fullName?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-poppins">
                  {user.fullName}
                </h1>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <Badge
                    variant={user.roleType === "LEADER" ? "default" : user.roleType === "ADMIN" ? "secondary" : "outline"}
                  >
                    {roleLabel(user.roleType)}
                  </Badge>
                  <Badge variant={user.isActive ? "default" : "destructive"} className="text-[10px]">
                    {user.isActive ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </span>
                {user.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {user.phone}
                  </span>
                )}
                {user.address && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {user.address}
                  </span>
                )}
                {user.communityGroup && (
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5" /> {user.communityGroup.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* === RESIDENT-ONLY: Dues Grid & Transaction History === */}
      {user.roleType === "RESIDENT" && (
        <>
          {/* Dues Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-poppins flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Status Iuran {currentYear}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {MONTHS.map((month, idx) => {
                  const isPaid = paidMonths.has(idx);
                  const isFuture = idx > new Date().getMonth();

                  return (
                    <div
                      key={idx}
                      className={`
                        relative flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all
                        ${isPaid
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : isFuture
                          ? "border-slate-100 bg-slate-50/50 text-slate-400"
                          : "border-red-200 bg-red-50 text-red-600"
                        }
                      `}
                    >
                      {isPaid && (
                        <CheckCircle2 className="h-5 w-5 mb-1" />
                      )}
                      {!isPaid && !isFuture && (
                        <XCircle className="h-5 w-5 mb-1" />
                      )}
                      <span className="text-xs font-semibold">{month}</span>
                      <span className="text-[10px] mt-0.5">
                        {isPaid ? "Lunas" : isFuture ? "—" : "Belum"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300 inline-block" />
                  Lunas
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />
                  Belum Bayar
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200 inline-block" />
                  Belum Jatuh Tempo
                </span>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg font-poppins">
                Riwayat Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userTransactions.length === 0 ? (
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
                      {userTransactions.map((tx, idx) => (
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
        </>
      )}

      {/* === NON-RESIDENT: Only profile info === */}
      {user.roleType !== "RESIDENT" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-poppins">Informasi Tambahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Email</p>
                <p className="font-medium text-slate-900">{user.email}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Role</p>
                <p className="font-medium text-slate-900">{roleLabel(user.roleType)}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Telepon</p>
                <p className="font-medium text-slate-900">{user.phone || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Alamat</p>
                <p className="font-medium text-slate-900">{user.address || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Grup</p>
                <p className="font-medium text-slate-900">{user.communityGroup?.name || "—"}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs mb-0.5">Bergabung</p>
                <p className="font-medium text-slate-900">
                  {new Date(user.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
