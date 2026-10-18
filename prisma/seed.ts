import { PrismaClient } from "@prisma/client";

/**
 * Dev seed. With Supabase Auth, accounts are created by signing up in the app
 * (not by the seed). So this attaches a demo project (in unpaid-preview) to the
 * FIRST user that has already signed up, so you can try the watermark quickly.
 *
 * Usage: sign up in the app once, then run `npm run db:seed`.
 */
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    console.log(
      "\nNo users yet. Sign up in the app first, then re-run `npm run db:seed`.\n",
    );
    return;
  }

  const existing = await prisma.project.findFirst({
    where: { ownerId: user.id, name: "Acme Studio (demo)" },
  });
  if (existing) {
    console.log(`\nDemo project already exists: ${existing.publicId}\n`);
    return;
  }

  const project = await prisma.project.create({
    data: {
      ownerId: user.id,
      publicId: `lg_pub_demo${Math.random().toString(16).slice(2, 14)}`,
      name: "Acme Studio (demo)",
      websiteUrl: "https://acme.example.com",
      environment: "development",
      watermarkConfig: JSON.stringify({
        style: "diagonal",
        text: "UNPAID PREVIEW — CONTACT TO PURCHASE",
        opacity: 0.16,
        size: "md",
        placement: "full",
        showContactLink: true,
      }),
      previewConfig: JSON.stringify({ mode: "links", allowSelector: "[data-lg-allow]" }),
      domains: { create: [{ domain: "localhost" }, { domain: "example.com" }] },
      license: { create: { status: "unpaid_preview" } },
      licenseEvents: { create: { type: "created", toStatus: "unpaid_preview", actor: user.id } },
    },
  });

  console.log(`\n✔ Demo project created for ${user.email}`);
  console.log(`  Public id: ${project.publicId}`);
  console.log(`  Open its live preview from the dashboard to see the watermark.\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
