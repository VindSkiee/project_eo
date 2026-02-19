import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Loader2, Settings, Lock } from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import type { DuesRule } from "@/features/finance/types";

// Helper: format number to thousand separator (10000 → 10.000)
function formatThousand(value: number): string {
  return new Intl.NumberFormat("id-ID").format(value);
}

// Helper: parse formatted string to number (10.000 → 10000)
function parseThousand(value: string): number {
  return Number(value.replace(/\./g, "").replace(/,/g, ""));
}

interface DuesConfigFormProps {
  currentRule: DuesRule | null;
  groupName: string;
  onSuccess: () => void;
  userRole?: string; // "LEADER" | "ADMIN" | "TREASURER" | "RESIDENT"
}

export function DuesConfigForm({ currentRule, groupName, onSuccess, userRole }: DuesConfigFormProps) {
  const [rawAmount, setRawAmount] = useState<number>(
    currentRule ? currentRule.amount : 0
  );
  const [dueDay, setDueDay] = useState<string>(
    currentRule ? String(currentRule.dueDay) : "10"
  );
  const [submitting, setSubmitting] = useState(false);

  // Format display value with thousand separator
  const displayAmount = useMemo(() => {
    if (rawAmount === 0) return "";
    return formatThousand(rawAmount);
  }, [rawAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Remove all non-digit characters
    const digitsOnly = input.replace(/\D/g, "");
    const numValue = Number(digitsOnly);
    setRawAmount(numValue);
  };

  // Only LEADER (RW) can set the due day
  const canSetDueDay = userRole === "LEADER";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rawAmount || rawAmount <= 0) {
      toast.error("Nominal iuran harus lebih dari 0.");
      return;
    }

    const numDueDay = Number(dueDay);
    if (!numDueDay || numDueDay < 1 || numDueDay > 31) {
      toast.error("Tanggal jatuh tempo harus antara 1-31.");
      return;
    }

    setSubmitting(true);
    try {
      await financeService.setDuesConfig({
        amount: rawAmount,
        dueDay: numDueDay,
      });
      toast.success("Konfigurasi iuran berhasil disimpan!");
      onSuccess();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(message || "Gagal menyimpan konfigurasi iuran.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-poppins">
          <Settings className="h-5 w-5 text-primary" />
          Atur Iuran {groupName}
        </CardTitle>
        <CardDescription>
          Tentukan nominal iuran bulanan{canSetDueDay ? " dan tanggal jatuh tempo" : ""} untuk {groupName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dues-amount">Nominal Iuran (Rp)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 font-medium">Rp</span>
                <Input
                  id="dues-amount"
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 15.000"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  className="pl-10 text-right font-semibold text-lg"
                  required
                />
              </div>
              {rawAmount > 0 && (
                <p className="text-xs text-emerald-600 font-medium">
                  = {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(rawAmount)} per bulan per warga
                </p>
              )}
              {!rawAmount && (
                <p className="text-xs text-slate-500">
                  Nominal per bulan per warga.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dues-day" className="flex items-center gap-1.5">
                Tanggal Jatuh Tempo
                {!canSetDueDay && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                    <Lock className="h-2.5 w-2.5" />
                    Hanya Ketua RW
                  </span>
                )}
              </Label>
              <Input
                id="dues-day"
                type="number"
                placeholder="Contoh: 10"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                min={1}
                max={31}
                required
                disabled={!canSetDueDay}
                className={!canSetDueDay ? "bg-slate-50 cursor-not-allowed" : ""}
              />
              <p className="text-xs text-slate-500">
                {canSetDueDay
                  ? "Tanggal 1-31 setiap bulan."
                  : "Hanya Ketua RW yang dapat mengubah tanggal jatuh tempo."}
              </p>
            </div>
          </div>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {currentRule ? "Perbarui Konfigurasi" : "Simpan Konfigurasi"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
