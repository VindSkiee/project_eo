import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Network } from "lucide-react";
import { toast } from "sonner";
import { dashboardService, type GroupItem } from "@/services/dashboardService";

export default function OrganizationPage() {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const data = await dashboardService.getGroups();
        setGroups(data);
      } catch {
        toast.error("Gagal memuat data organisasi.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const rwGroups = groups.filter((g) => g.type === "RW");
  const rtGroups = groups.filter((g) => g.type === "RT");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-slate-900">
          Organisasi
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Daftar seluruh organisasi RT/RW di lingkungan Anda.
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
              Total
            </CardTitle>
            <Building2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {groups.length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
              RW
            </CardTitle>
            <Network className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {rwGroups.length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 font-poppins">
              RT
            </CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold text-slate-900">
                {rtGroups.length}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Group List */}
      {loading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-20 mt-1" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Building2 className="h-10 w-10 text-slate-300 mb-3" />
            <p className="text-sm text-slate-500 font-medium">
              Belum ada data organisasi.
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Data organisasi RT/RW akan tampil di sini.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* RW Section */}
          {rwGroups.length > 0 && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 font-poppins">
                Rukun Warga (RW)
              </h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {rwGroups.map((group) => (
                  <Card key={group.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm sm:text-base font-semibold text-slate-900">
                          {group.name}
                        </CardTitle>
                        <Badge variant="default" className="text-[10px] sm:text-xs">
                          {group.type}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs text-slate-400">
                        Dibuat{" "}
                        {new Date(group.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* RT Section */}
          {rtGroups.length > 0 && (
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-3 font-poppins">
                Rukun Tetangga (RT)
              </h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {rtGroups.map((group) => {
                  const parentRw = rwGroups.find(
                    (rw) => rw.id === group.parentId
                  );
                  return (
                    <Card key={group.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm sm:text-base font-semibold text-slate-900">
                            {group.name}
                          </CardTitle>
                          <Badge
                            variant="secondary"
                            className="text-[10px] sm:text-xs"
                          >
                            {group.type}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-slate-400">
                          {parentRw
                            ? `Bagian dari ${parentRw.name}`
                            : "Tanpa induk RW"}
                          {" · "}
                          Dibuat{" "}
                          {new Date(group.createdAt).toLocaleDateString(
                            "id-ID",
                            {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            }
                          )}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
