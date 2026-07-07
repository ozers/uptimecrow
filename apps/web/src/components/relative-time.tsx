import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export function RelativeTime({ date }: { date: string | Date }) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <span title={d.toLocaleString()} className="font-mono tnum">
      {formatDistanceToNow(d, { addSuffix: true })}
    </span>
  );
}

export function AbsoluteTime({ date }: { date: string | Date }) {
  const d = typeof date === "string" ? new Date(date) : date;

  let display: string;
  if (isToday(d)) {
    display = format(d, "HH:mm:ss");
  } else if (isYesterday(d)) {
    display = `Yesterday ${format(d, "HH:mm")}`;
  } else {
    display = format(d, "MMM d, HH:mm");
  }

  return (
    <span title={d.toLocaleString()} className="font-mono tnum">
      {display}
    </span>
  );
}
