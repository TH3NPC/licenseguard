import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Dev seed: one demo developer account + one project in unpaid-preview so the
 * dashboard and the example site work immediately. Safe to re-run (idempotent).
 *
 * Run with: npm run db:seed
 */
const prisma = new PrismaClient();

const DEMO_EMAIL = "dev@licenseguard.test";
const DEMO_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      email: DEMO_EMAIL,
      passwordHash,
      name: "Demo Developer",
      defaultPortfolioUrl: "https://your-portfolio.example.com",
      subscriptions: {
        create: {
          plan: "developer",
          status: "active",
          currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
        },
      },
    },
  });

  const existing = await prisma.project.findFirst({
    where: { ownerId: user.id, name: "Northwind Coffee (demo)" },
    include: { license: true },
  });

  const project =
    existing ??
    (await prisma.project.create({
      data: {
        ownerId: user.id,
        publicId: `lg_pub_${"demo000000000000".slice(0, 12)}${Math.random().toString(16).slice(2, 8)}`,
        name: "Northwind Coffee (demo)",
        websiteUrl: "https://northwind.example.com",
        environment: "development",
        watermarkConfig: JSON.stringify({
          style: "diagonal",
          text: "UNPAID PREVIEW — CONTACT TO PURCHASE",
          opacity: 0.16,
          size: "md",
          placement: "full",
          contactUrl: "https://your-portfolio.example.com",
          showContactLink: true,
        }),
        previewConfig: JSON.stringify({
          mode: "links",
          redirectUrl: "https://your-portfolio.example.com",
          selector: "",
          allowSelector: "[data-lg-allow]",
          notice: "This is an unpaid preview. Contact to purchase.",
        }),
        domains: { create: [{ domain: "localhost" }, { domain: "example.com" }] },
        license: { create: { status: "unpaid_preview" } },
        licenseEvents: { create: { type: "created", toStatus: "unpaid_preview", actor: user.id } },
      },
      include: { license: true },
    }));

  console.log("\n✔ Seed complete");
  console.log(`  Login:        ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  Project:      ${project.name}`);
  console.log(`  Public id:    ${project.publicId}`);
  console.log(`  Paste that id into examples/demo-site/index.html\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
