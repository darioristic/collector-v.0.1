import { db, pgClient } from "../src/db/index";
import { users } from "../src/db/schema/settings.schema";
import { eq } from "drizzle-orm";
import { compare, hash } from "bcryptjs";

const email = process.argv[2] || "dario@collectorlabs.test";
const password = process.argv[3] || "Collector!2025";

async function testPassword() {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        hashedPassword: users.hashedPassword,
      })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user) {
      console.log(`❌ Korisnik sa emailom "${email}" ne postoji u bazi.`);
      await pgClient.end();
      process.exit(1);
    }

    console.log(`✅ Korisnik pronađen: ${user.email}`);
    console.log(`📝 Hash dužina: ${user.hashedPassword.length}`);
    console.log(`📝 Hash (prvih 50 karaktera): ${user.hashedPassword.substring(0, 50)}...`);

    // Testiramo da li se lozinka može verifikovati
    try {
      const matches = await compare(password, user.hashedPassword);
      if (matches) {
        console.log(`✅ Lozinka "${password}" se podudara sa hash-om u bazi!`);
      } else {
        console.log(`❌ Lozinka "${password}" se NE podudara sa hash-om u bazi!`);
        
        // Generišemo novi hash da vidimo razliku
        const newHash = await hash(password, 12);
        console.log(`\n📝 Novi hash za lozinku "${password}":`);
        console.log(`   ${newHash.substring(0, 50)}...`);
        console.log(`\n💡 Razlika u hash-ovima može biti normalna (svaki hash je jedinstven),`);
        console.log(`   ali lozinka bi trebala da se verifikuje sa oba hash-a.`);
      }
    } catch (error) {
      console.error(`❌ Greška pri proveri lozinke:`, error);
    }

    await pgClient.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Greška pri testiranju lozinke:", error);
    await pgClient.end();
    process.exit(1);
  }
}

testPassword();

