import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { COMPANIES } from "../lib/companies.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Seeds the example companies as demo listings so the catalog and AI search
// have something to work with. Every record is flagged isDemo so the UI can
// label it honestly as an example rather than a real registered business.
async function main() {
  let created = 0;
  for (const c of COMPANIES) {
    const existing = await prisma.company.findFirst({
      where: { name: c.name, isDemo: true },
    });
    if (existing) continue;

    await prisma.company.create({
      data: {
        name: c.name,
        about: c.about,
        category: c.category,
        contact: c.contact,
        isDemo: true,
        listings: {
          create: {
            title: `Бартер: ${c.name}`,
            gives: c.gives,
            seeks: c.seeks,
            category: c.category,
          },
        },
      },
    });
    created++;
  }
  console.log(`seed: ${created} demo companies created, ${COMPANIES.length - created} already present`);
}

main()
  // Seeding runs on every boot. It must never take the app down — if it fails
  // (transient DB blip, etc.) log it and let the server start anyway.
  .catch((e) => console.error("seed skipped:", e.message))
  .finally(() => prisma.$disconnect());
