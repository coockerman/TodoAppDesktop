import { format, isToday, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

export const dateKey = (date: Date) => format(date, "yyyy-MM-dd");
export const parseDateKey = (value: string) => parseISO(`${value}T00:00:00`);
export const formatFullDate = (date: Date) => {
  if (isToday(date)) return `Hôm nay, ${format(date, "dd/MM")}`;
  const label = format(date, "EEEE, dd/MM", { locale: vi });
  return label.charAt(0).toUpperCase() + label.slice(1);
};
