import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-t border-[var(--line)] first:border-t-0 text-sm">
      <span className="text-[var(--subtle)]">{label}</span>
      <span className="text-right font-medium truncate">{value}</span>
    </div>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h1 className="text-[1.75rem]">Settings</h1>
        <p className="text-sm text-[var(--muted)]">Your account, plan, and defaults for new projects.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="box-title mb-2">Account</h2>
          <Row label="Email" value={<span className="mono">{user.email}</span>} />
          <Row label="Member since" value={new Date(user.createdAt).toLocaleDateString()} />
        </section>

        <section className="card p-5">
          <h2 className="box-title mb-2">Plan</h2>
          {subscription ? (
            <>
              <Row label="Plan" value={<span className="capitalize">{subscription.plan}</span>} />
              <Row label="Status" value={<span className="capitalize">{subscription.status}</span>} />
              <Row
                label="Renews"
                value={subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "—"}
              />
            </>
          ) : (
            <p className="text-sm text-[var(--subtle)]">No plan on record.</p>
          )}
        </section>
      </div>

      <SettingsForm
        defaults={{
          name: user.name ?? "",
          defaultPortfolioUrl: user.defaultPortfolioUrl ?? "",
          defaultWatermarkText: user.defaultWatermarkText,
          defaultWatermarkStyle: user.defaultWatermarkStyle,
        }}
      />
    </div>
  );
}
