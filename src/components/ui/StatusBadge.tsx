import { badgeClass, licenseDisplay } from "@/lib/status-display";

export function StatusBadge({ status }: { status: string }) {
  const { label, tone } = licenseDisplay(status);
  return <span className={badgeClass(tone)}>{label}</span>;
}
