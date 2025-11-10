import { pgClient } from "../index";
import { seedAccounts } from "./accounts";

const run = async () => {
  await seedAccounts();
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
