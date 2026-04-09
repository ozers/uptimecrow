import { formatDistanceToNow } from "date-fns";

export function RelativeTime({ date }: { date: string | Date }) {
  const d = typeof date === "string" ? new Date(date) : date;
  return (
    <span title={d.toLocaleString()}>
      {formatDistanceToNow(d, { addSuffix: true })}
    </span>
  );
}
