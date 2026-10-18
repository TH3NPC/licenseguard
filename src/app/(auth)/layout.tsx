import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center gap-2 justify-center">
          <span className="inline-block h-6 w-6 rounded-[var(--radius-sm)] bg-[var(--color-accent)]" aria-hidden />
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <div className="card p-6">{children}</div>
      </div>
    </main>
  );
}
