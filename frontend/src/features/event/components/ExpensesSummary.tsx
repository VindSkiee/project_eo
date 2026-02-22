import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { CheckCircle2, Clock, Receipt, XCircle, FileImage, Image as ImageIcon } from "lucide-react";
import type { EventItem } from "@/shared/types";
import { getAvatarUrl } from "@/shared/helpers/avatarUrl";

function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Tidak ditentukan";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

interface ExpensesSummaryProps {
  event: EventItem;
  canVerify?: boolean;
  onVerify?: (expenseId: string, isValid: boolean) => Promise<void>;
}

export function ExpensesSummary({ event, canVerify, onVerify }: ExpensesSummaryProps) {
  // Nota/receipt images disimpan di event.receiptImages
  const receiptImages = (event.receiptImages ?? []).map((p) => getAvatarUrl(p)).filter(Boolean) as string[];

  // State untuk mengontrol dialog nota (karena gambarnya lebih dari 1, kita simpan index/url aktifnya)
  const [openNotaDialog, setOpenNotaDialog] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const validExpenses = event.expenses?.filter((exp) => exp.isValid) || [];
  const validExpensesTotal = validExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

  return (
    <>
      <Card className="border-slate-200 shadow-sm flex flex-col h-full max-h-[600px]">
        <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-slate-800">
              <div className="p-1.5 rounded-md bg-amber-100 text-amber-600">
                <Receipt className="h-4 w-4" />
              </div>
              Pengeluaran ({event.expenses?.length || 0})
            </CardTitle>
            
            {/* === TOMBOL LIHAT NOTA DI PINDAH KE HEADER AGAR RINGKAS === */}
            {receiptImages.length > 0 && (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-medium border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                onClick={() => {
                  setActiveImageIndex(0);
                  setOpenNotaDialog(true);
                }}
              >
                <FileImage className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                Lihat Bukti Nota
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-4 flex-1 overflow-y-auto flex flex-col">
          {!event.expenses || event.expenses.length === 0 ? (
            <div className="text-center py-6 my-auto">
              <p className="text-sm text-slate-500 font-medium">Belum ada pengeluaran tercatat.</p>
            </div>
          ) : (
            <div className="space-y-5 flex flex-col">
              
              {/* === RINGKASAN PENGELUARAN (NOTA STYLE) === */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shrink-0 shadow-sm">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-slate-500 font-medium shrink-0">
                      Total Diajukan
                    </p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 text-right">
                      {formatRupiah(Number(event.budgetEstimated))}
                    </p>
                  </div>
                  
                  <div className="border-t border-dashed border-slate-200"></div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <p className="text-sm text-emerald-700 font-medium">
                        Tervalidasi
                      </p>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-emerald-700 text-right">
                      {formatRupiah(validExpensesTotal)}
                    </p>
                  </div>
                </div>
              </div>

              {/* === LIST PENGELUARAN === */}
              <div className="space-y-2.5">
                {event.expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-amber-200/50 hover:shadow-sm bg-white transition-all gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {exp.title}
                        </p>
                        {exp.isValid ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md shrink-0">
                            <CheckCircle2 className="h-3 w-3" /> Sah
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md shrink-0">
                            <Clock className="h-3 w-3" /> Pending
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{formatDate(exp.createdAt)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 mt-1 sm:mt-0 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <p className="text-sm font-bold text-slate-900 font-poppins">
                        {formatRupiah(exp.amount)}
                      </p>
                      
                      {/* ACTION BUTTONS */}
                      {canVerify && !exp.isValid && onVerify && (
                        <div className="flex gap-1.5 border-l border-slate-200 pl-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 transition-colors"
                            onClick={() => onVerify(exp.id, true)}
                            title="Validasi Pengeluaran"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition-colors"
                            onClick={() => onVerify(exp.id, false)}
                            title="Tolak Pengeluaran"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* === DIALOG PREVIEW SEMUA GAMBAR NOTA === */}
      <Dialog open={openNotaDialog} onOpenChange={setOpenNotaDialog}>
        <DialogContent className="max-w-3xl p-4 sm:p-6 bg-slate-50">
          <DialogHeader className="mb-2">
            <DialogTitle className="font-poppins flex items-center gap-2 text-slate-800">
              <FileImage className="h-5 w-5 text-amber-500" />
              Bukti Nota Transaksi
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            {/* Tampilan Gambar Utama */}
            <div className="flex items-center justify-center p-2 bg-white rounded-xl border border-slate-200 overflow-hidden min-h-[40vh] max-h-[60vh] shadow-sm">
              {receiptImages[activeImageIndex] ? (
                <img 
                  src={receiptImages[activeImageIndex]} 
                  alt={`Bukti Nota ${activeImageIndex + 1}`} 
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center text-slate-400">
                  <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                  <p className="text-sm">Gambar tidak dapat dimuat</p>
                </div>
              )}
            </div>

            {/* Thumbnail Navigasi (Jika ada lebih dari 1 gambar) */}
            {receiptImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 px-1">
                {receiptImages.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex 
                        ? "border-amber-500 shadow-md ring-2 ring-amber-100 ring-offset-1" 
                        : "border-transparent hover:border-slate-300 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}