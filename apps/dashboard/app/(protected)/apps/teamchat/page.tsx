import { redirect } from "next/navigation";

import { TeamChatClient } from "@/app/(protected)/apps/teamchat/team-chat-client";
import { getCurrentAuth } from "@/lib/auth";
import { bootstrapTeamChat } from "@/lib/teamchat/repository";
import { generateMeta } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return generateMeta({
    title: "TeamChat",
    description:
      "Interni sistem poruka vaše kompanije sa kanalima, direktnim porukama i podrškom za fajlove.",
    canonical: "/apps/teamchat"
  });
}

export default async function TeamChatPage() {
  const auth = await getCurrentAuth();

  if (!auth || !auth.user || !auth.user.company) {
    redirect("/auth/login");
  }

  const bootstrap = await bootstrapTeamChat({
    authUser: auth.user,
    authCompany: auth.user.company
  });

  return (
    <div className="flex h-[calc(100vh-var(--header-height)-3rem)] w-full gap-4">
      <TeamChatClient bootstrap={bootstrap} />
    </div>
  );
}
