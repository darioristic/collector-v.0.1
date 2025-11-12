import { db, pgClient } from "../src/db/index";
import { users } from "../src/db/schema/settings.schema";
import { eq } from "drizzle-orm";

const email = process.argv[2] || "tara@collectorlabs.test";

async function checkUser() {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        status: users.status,
        hasPassword: users.hashedPassword,
        defaultCompanyId: users.defaultCompanyId,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      console.log(`❌ Korisnik sa emailom "${email}" ne postoji u bazi.`);
      console.log("\n💡 Pokrenite seed skriptu:");
      console.log("   bun run db:seed --only auth");
      await pgClient.end();
      process.exit(1);
    }

    console.log(`✅ Korisnik pronađen:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Ime: ${user.name}`);
    console.log(`   Status: ${user.status}`);
    console.log(`   Ima password: ${user.hasPassword ? "✅" : "❌"}`);
    console.log(`   Default Company ID: ${user.defaultCompanyId || "Nema"}`);

    if (!user.hasPassword || user.hasPassword.trim() === "") {
      console.log("\n⚠️  Korisnik nema password!");
    }

    if (user.status !== "active") {
      console.log(`\n⚠️  Korisnik nije aktivan (status: ${user.status})`);
    }

    await pgClient.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Greška pri proveri korisnika:", error);
    await pgClient.end();
    process.exit(1);
  }
}

checkUser();

