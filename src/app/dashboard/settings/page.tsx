import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/SettingsForm";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const subscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-5">Settings</h1>

      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold">Account</h2>
        <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-[var(--color-subtle)]">Email</dt>
          <dd className="text-right mono">{user.email}</dd>
          <dt className="text-[var(--color-subtle)]">Member since</dt>
          <dd className="text-right">{new Date(user.createdAt).toLocaleDateString()}</dd>
        </dl>
      </div>

      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold">Subscription</h2>
        {subscription ? (
          <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-[var(--color-subtle)]">Plan</dt>
            <dd className="text-right capitalize">{subscription.plan}</dd>
            <dt className="text-[var(--color-subtle)]">Status</dt>
            <dd className="text-right capitalize">{subscription.status}</dd>
            <dt className="text-[var(--color-subtle)]">Renews / ends</dt>
            <dd className="text-right">
              {subscription.currentPeriodEnd
                ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                : "—"}
            </dd>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-subtle)]">No subscription on record.</p>
        )}
        <p className="mt-3 text-xs text-[var(--color-subtle)]">
          A developer subscription governs your account access. It is separate
          from each client project&apos;s commercial license.
        </p>
      </div>

      <h2 className="text-sm font-semibold mb-3">Project defaults</h2>
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
