import { pgClient } from "../index";
import { seedAccounts } from "./accounts";
import { seedCrm } from "./crm";
import { seedSales } from "./sales";
import { seedProjects } from "./projects";
import { seedSettings } from "./settings";

const run = async () => {
  await seedAccounts();
  await seedCrm();
  await seedSales();
  await seedProjects();
  await seedSettings();
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
