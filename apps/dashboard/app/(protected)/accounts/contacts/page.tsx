import { promises as fs } from "fs";
import path from "path";

import Link from "next/link";
import { generateMeta } from "@/lib/utils";

import { PlusCircledIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import ContactsDataTable from "./data-table";

export async function generateMetadata() {
  return generateMeta({
    title: "Contacts",
    description:
      "Manage contacts and quickly access their related companies with a TanStack Table experience built with Tailwind CSS, shadcn/ui, and Next.js.",
    canonical: "/accounts/contacts"
  });
}

async function getUsers() {
  const data = await fs.readFile(
    path.join(process.cwd(), "app/(protected)/accounts/contacts/data.json")
  );
  return JSON.parse(data.toString());
}

export default async function Page() {
  const users = await getUsers();

  return (
    <>
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
        <Button asChild>
          <Link href="#">
            <PlusCircledIcon /> Add New Contact
          </Link>
        </Button>
      </div>
      <ContactsDataTable data={users} />
    </>
  );
}
