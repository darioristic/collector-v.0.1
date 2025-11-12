import { db, pgClient } from "../src/db/index";
import { AuthService } from "../src/modules/auth/auth.service";

const email = process.argv[2] || "dario@collectorlabs.test";
const password = process.argv[3] || "Collector!2025";

async function testLogin() {
	try {
		const authService = new AuthService(db);

		console.log(`\n🔐 Testiranje login-a za: ${email}`);
		console.log(`📝 Lozinka: ${password}\n`);

		const result = await authService.login(
			{ email, password },
			{
				ipAddress: "127.0.0.1",
				userAgent: "test-script",
			},
		);

		console.log(`✅ Login uspešan!`);
		console.log(`   User ID: ${result.user.id}`);
		console.log(`   User Email: ${result.user.email}`);
		console.log(`   User Name: ${result.user.name}`);
		console.log(`   Company: ${result.user.company?.name || "Nema"}`);
		console.log(
			`   Session Token: ${result.session.token.substring(0, 20)}...`,
		);
		console.log(`   Session Expires: ${result.session.expiresAt}\n`);

		await pgClient.end();
		process.exit(0);
	} catch (error) {
		console.error(`\n❌ Login neuspešan:`);
		if (error instanceof Error) {
			console.error(`   Error: ${error.message}`);
			console.error(`   Stack: ${error.stack}`);
		} else {
			console.error(`   Error:`, error);
		}

		await pgClient.end();
		process.exit(1);
	}
}

testLogin();
