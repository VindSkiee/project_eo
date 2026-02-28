// Shared status config — single source of truth for event & fund request statuses

// ==========================================
// EVENT STATUS
// ==========================================
const EVENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT:        { label: "Draft",          className: "bg-slate-100 text-slate-600 border-slate-200" },
  SUBMITTED:    { label: "Diajukan",       className: "bg-amber-50 text-amber-700 border-amber-200" },
  UNDER_REVIEW: { label: "Dalam Review",   className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  APPROVED:     { label: "Disetujui",      className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED:     { label: "Ditolak",        className: "bg-red-50 text-red-700 border-red-200" },
  CANCELLED:    { label: "Dibatalkan",     className: "bg-rose-50 text-rose-700 border-rose-200" },
  FUNDED:       { label: "Didanai",        className: "bg-blue-50 text-blue-700 border-blue-200" },
  ONGOING:      { label: "Berlangsung",    className: "bg-purple-50 text-purple-700 border-purple-200" },
  COMPLETED:    { label: "Selesai",        className: "bg-teal-50 text-teal-700 border-teal-200" },
  SETTLED:      { label: "Diselesaikan",   className: "bg-green-50 text-green-700 border-green-200" },
};

export function getEventStatusInfo(status: string): { label: string; className: string } {
  return EVENT_STATUS_CONFIG[status] ?? { label: status, className: "bg-slate-50 text-slate-600 border-slate-200" };
}

// ==========================================
// FUND REQUEST STATUS
// ==========================================
const FUND_REQUEST_STATUS_CONFIG: Record<string, { label: string; variant: "outline" | "default" | "destructive"; className: string }> = {
  PENDING:  { label: "Menunggu",  variant: "outline",      className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  APPROVED: { label: "Disetujui", variant: "default",      className: "" },
  REJECTED: { label: "Ditolak",   variant: "destructive",  className: "" },
};

export function getFundRequestStatusInfo(status: string) {
  return FUND_REQUEST_STATUS_CONFIG[status] ?? {
    label: status,
    variant: "outline" as const,
    className: "bg-slate-50 text-slate-600 border-slate-200",
  };
}
