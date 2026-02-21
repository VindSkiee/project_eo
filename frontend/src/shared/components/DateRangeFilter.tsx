import * as React from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { CalendarDays, X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { Calendar } from "@/shared/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { cn } from "@/shared/lib/utils";

export type { DateRange };

interface DateRangeFilterProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangeFilter({
  value,
  onChange,
  className,
  placeholder = "Filter tanggal",
}: DateRangeFilterProps) {
  const [open, setOpen] = React.useState(false);

  const hasValue = value?.from !== undefined;

  const label = React.useMemo(() => {
    if (!value?.from) return null;
    if (!value.to) return format(value.from, "d MMM yyyy", { locale: localeId });
    return `${format(value.from, "d MMM yyyy", { locale: localeId })} – ${format(value.to, "d MMM yyyy", { locale: localeId })}`;
  }, [value]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-10 gap-2 font-normal text-sm",
            hasValue
              ? "border-primary/60 text-primary bg-primary/5 hover:bg-primary/10"
              : "text-slate-500",
            className
          )}
        >
          <CalendarDays className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-[180px]">
            {label ?? placeholder}
          </span>
          {hasValue && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as unknown as React.MouseEvent)}
              className="ml-1 rounded-full hover:bg-primary/20 p-0.5 transition-colors"
              aria-label="Hapus filter tanggal"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 shadow-lg"
        align="start"
        sideOffset={6}
      >
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          initialFocus
          className="rounded-md"
        />
        {hasValue && (
          <div className="border-t px-3 py-2 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-slate-500 h-7"
              onClick={() => {
                onChange(undefined);
                setOpen(false);
              }}
            >
              Reset
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
