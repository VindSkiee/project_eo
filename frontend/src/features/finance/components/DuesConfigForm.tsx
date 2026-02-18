import { useState } from "react";
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
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { financeService } from "@/features/finance/services/financeService";
import type { DuesRule } from "@/features/finance/types";

interface DuesConfigFormProps {
  currentRule: DuesRule | null;
  groupName: string;
  onSuccess: () => void;
}

export function DuesConfigForm({ currentRule, groupName, onSuccess }: DuesConfigFormProps) {
  const [amount, setAmount] = useState<string>(
    currentRule ? String(currentRule.amount) : ""
  );
  const [dueDay, setDueDay] = useState<string>(
    currentRule ? String(currentRule.dueDay) : "10"
  );
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = Number(amount);
    const numDueDay = Number(dueDay);

    if (!numAmount || numAmount <= 0) {
      toast.error("Nominal iuran harus lebih dari 0.");
      return;
    }
    if (!numDueDay || numDueDay < 1 || numDueDay > 31) {
      toast.error("Tanggal jatuh tempo harus antara 1-31.");
      return;
    }

    setSubmitting(true);
    try {
      await financeService.setDuesConfig({
        amount: numAmount,
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
          Tentukan nominal iuran bulanan dan tanggal jatuh tempo untuk {groupName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dues-amount">Nominal Iuran (Rp)</Label>
              <Input
                id="dues-amount"
                type="number"
                placeholder="Contoh: 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                required
              />
              <p className="text-xs text-slate-500">
                Nominal per bulan per warga.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dues-day">Tanggal Jatuh Tempo</Label>
              <Input
                id="dues-day"
                type="number"
                placeholder="Contoh: 10"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                min={1}
                max={31}
                required
              />
              <p className="text-xs text-slate-500">
                Tanggal 1-31 setiap bulan.
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
