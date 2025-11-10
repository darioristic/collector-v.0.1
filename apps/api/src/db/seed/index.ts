import { pgClient } from "../index";
import { seedAccounts } from "./accounts";
import { seedSales } from "./sales";

const run = async () => {
  await seedAccounts();
  await seedSales();
};

run()
  .then(async () => {
    console.log("Database seeded successfully");
    await pgClient.end();
  })
  .catch(async (error) => {
    console.error("Failed to seed database", error);
    await pgClient.end();
    process.exit(1);
  });
