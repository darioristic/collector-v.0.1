import { setTimeout as delay } from "node:timers/promises";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

type LoginResponse = {
  data?: {
    user?: Record<string, unknown>;
    session?: { token: string; expiresAt: string };
  };
  error?: string;
};

async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie") || "";
  const m = setCookie.match(/auth_session=([^;]+)/);
  const token = m ? m[1] : null;
  const json = (await res.json().catch(() => ({}))) as LoginResponse;
  return { ok: res.ok, token, json };
}

async function loginEmployee(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/employees-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie") || "";
  const m = setCookie.match(/auth_session=([^;]+)/);
  const token = m ? m[1] : null;
  const json = (await res.json().catch(() => ({}))) as LoginResponse;
  return { ok: res.ok, token, json };
}

async function createConversation(cookie: string, targetEmail: string) {
  const res = await fetch(`${BASE_URL}/api/chat/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Cookie: `auth_session=${cookie}` },
    body: JSON.stringify({ targetEmail }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json } as { ok: boolean; json: { conversation?: { id: string } } };
}

async function sendMessage(cookie: string, conversationId: string, content: string) {
  const res = await fetch(`${BASE_URL}/api/chat/conversations/${conversationId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Cookie: `auth_session=${cookie}` },
    body: JSON.stringify({ content, type: "text" }),
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

async function getMessages(cookie: string, conversationId: string, limit = 50) {
  const res = await fetch(`${BASE_URL}/api/chat/conversations/${conversationId}/messages?limit=${limit}`, {
    method: "GET",
    headers: { Accept: "application/json", Cookie: `auth_session=${cookie}` },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

async function markRead(cookie: string, conversationId: string) {
  const res = await fetch(`${BASE_URL}/api/chat/conversations/${conversationId}/messages/read`, {
    method: "PUT",
    headers: { Accept: "application/json", Cookie: `auth_session=${cookie}` },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

async function getConversations(cookie: string) {
  const res = await fetch(`${BASE_URL}/api/chat/conversations`, {
    method: "GET",
    headers: { Accept: "application/json", Cookie: `auth_session=${cookie}` },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, json };
}

function getMinutesArg() {
  const arg = process.argv.find((a) => a.startsWith("--minutes="));
  if (!arg) return 10;
  const n = parseInt(arg.split("=")[1], 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
}

async function main() {
  const minutes = getMinutesArg();
  const cutoff = Date.now() - minutes * 60_000;
  console.log("Login kao Dario...");
  const dario = await login("dario@collectorlabs.test", "Collector!2025");
  if (!dario.ok || !dario.token) {
    console.error("Neuspešan login Dario", dario.json);
    process.exit(1);
  }

  console.log("Login kao Miha...");
  const miha = await login("miha@collectorlabs.test", "Collector!2025");
  if (!miha.ok || !miha.token) {
    console.error("Neuspešan login Miha", miha.json);
    process.exit(1);
  }

  console.log("Login kao Tara...");
  const tara = await login("tara@collectorlabs.test", "Collector!2025");
  if (!tara.ok || !tara.token) {
    console.error("Neuspešan login Tara", tara.json);
    process.exit(1);
  }

  console.log("Kreiranje konverzacije (Dario -> Miha)...");
  const createdDM = await createConversation(dario.token, "miha@collectorlabs.test");
  if (!createdDM.ok || !createdDM.json?.conversation?.id) {
    console.error("Neuspešno kreiranje konverzacije Dario-Miha", createdDM.json);
    process.exit(1);
  }
  const conversationIdDM = createdDM.json.conversation.id;
  console.log("Konverzacija Dario-Miha", conversationIdDM);

  console.log("Kreiranje konverzacije (Dario -> Tara)...");
  const createdDT = await createConversation(dario.token, "tara@collectorlabs.test");
  if (!createdDT.ok || !createdDT.json?.conversation?.id) {
    console.error("Neuspešno kreiranje konverzacije Dario-Tara", createdDT.json);
    process.exit(1);
  }
  const conversationIdDT = createdDT.json.conversation.id;
  console.log("Konverzacija Dario-Tara", conversationIdDT);

  console.log("Slanje poruke od Daria (ka Miha)...");
  const sent1 = await sendMessage(dario.token, conversationIdDM, "Pozdrav Miha, ovo je test poruka.");
  if (!sent1.ok) {
    console.error("Neuspešno slanje poruke", sent1.json);
    process.exit(1);
  }

  await delay(300);

  console.log("Slanje odgovora od Mihe...");
  const sent2 = await sendMessage(miha.token, conversationIdDM, "Zdravo Dario, poruka primljena.");
  if (!sent2.ok) {
    console.error("Neuspešno slanje odgovora", sent2.json);
    process.exit(1);
  }

  await delay(300);

  console.log("Slanje poruke od Daria (ka Tara)...");
  const sent3 = await sendMessage(dario.token, conversationIdDT, "Pozdrav Tara, test poruka.");
  if (!sent3.ok) {
    console.error("Neuspešno slanje poruke ka Tari", sent3.json);
    process.exit(1);
  }

  await delay(300);

  console.log("Slanje odgovora od Tare...");
  const sent4 = await sendMessage(tara.token, conversationIdDT, "Zdravo Dario, primljeno.");
  if (!sent4.ok) {
    console.error("Neuspešno slanje odgovora od Tare", sent4.json);
    process.exit(1);
  }

  console.log("Preuzimanje poruka Dario-Miha...");
  const msgs = await getMessages(dario.token, conversationIdDM, 50);
  if (!msgs.ok) {
    console.error("Neuspešno preuzimanje poruka", msgs.json);
    process.exit(1);
  }
  const list = Array.isArray((msgs.json as any).messages) ? (msgs.json as any).messages : [];
  console.log("Poruke", list.map((m: any) => ({ id: m.id, content: m.content, senderId: m.senderId, status: m.status })));

  console.log("Označavanje kao pročitano (Dario i Miha, DM)...");
  const readDario = await markRead(dario.token, conversationIdDM);
  if (!readDario.ok) {
    console.error("Neuspešno označavanje pročitanih (Dario)", readDario.json);
    process.exit(1);
  }
  const readMiha = await markRead(miha.token, conversationIdDM);
  if (!readMiha.ok) {
    console.error("Neuspešno označavanje pročitanih (Miha)", readMiha.json);
    process.exit(1);
  }

  await delay(300);

  console.log(`Validacija statusa poruka u poslednjih ${minutes} min (DM)...`);
  const msgsAfterRead = await getMessages(dario.token, conversationIdDM, 100);
  if (!msgsAfterRead.ok) {
    console.error("Neuspešno preuzimanje poruka za validaciju", msgsAfterRead.json);
    process.exit(1);
  }
  const recent = Array.isArray((msgsAfterRead.json as any).messages) ? (msgsAfterRead.json as any).messages : [];
  const recentFiltered = recent.filter((m: any) => {
    const t = m.createdAt ? Date.parse(m.createdAt) : null;
    return t ? t >= cutoff : true;
  });
  const notRead = recentFiltered.filter((m: any) => m.status !== "read");
  if (notRead.length > 0) {
    console.error("Poruke koje nisu označene kao pročitane:", notRead.map((m: any) => ({ id: m.id, content: m.content, senderId: m.senderId, status: m.status, createdAt: m.createdAt })));
    process.exit(1);
  }

  console.log("Označavanje kao pročitano (Dario i Tara, DT)...");
  const readDarioT = await markRead(dario.token, conversationIdDT);
  if (!readDarioT.ok) {
    console.error("Neuspešno označavanje pročitanih (Dario - DT)", readDarioT.json);
    process.exit(1);
  }
  const readTara = await markRead(tara.token, conversationIdDT);
  if (!readTara.ok) {
    console.error("Neuspešno označavanje pročitanih (Tara - DT)", readTara.json);
    process.exit(1);
  }

  await delay(300);

  console.log(`Validacija statusa poruka u poslednjih ${minutes} min (DT)...`);
  const msgsAfterReadDT = await getMessages(dario.token, conversationIdDT, 100);
  if (!msgsAfterReadDT.ok) {
    console.error("Neuspešno preuzimanje poruka za validaciju (DT)", msgsAfterReadDT.json);
    process.exit(1);
  }
  const recentDT = Array.isArray((msgsAfterReadDT.json as any).messages) ? (msgsAfterReadDT.json as any).messages : [];
  const recentFilteredDT = recentDT.filter((m: any) => {
    const t = m.createdAt ? Date.parse(m.createdAt) : null;
    return t ? t >= cutoff : true;
  });
  const notReadDT = recentFilteredDT.filter((m: any) => m.status !== "read");
  if (notReadDT.length > 0) {
    console.error("Poruke koje nisu označene kao pročitane (DT):", notReadDT.map((m: any) => ({ id: m.id, content: m.content, senderId: m.senderId, status: m.status, createdAt: m.createdAt })));
    process.exit(1);
  }

  console.log("Provera konverzacija (Dario)...");
  const convs = await getConversations(dario.token);
  if (!convs.ok) {
    console.error("Neuspešno preuzimanje konverzacija", convs.json);
    process.exit(1);
  }
  const conversations = Array.isArray((convs.json as any).conversations) ? (convs.json as any).conversations : [];
  const cDM = conversations.find((x: any) => x.id === conversationIdDM) || null;
  const cDT = conversations.find((x: any) => x.id === conversationIdDT) || null;
  if (cDM) {
    console.log("Konverzacija Dario-Miha", { id: cDM.id, unreadCount: cDM.unreadCount ?? null, lastMessage: cDM.lastMessage });
  }
  if (cDT) {
    console.log("Konverzacija Dario-Tara", { id: cDT.id, unreadCount: cDT.unreadCount ?? null, lastMessage: cDT.lastMessage });
  }

  console.log("Simulacija završena uspešno.");
}

main().catch((e) => {
  console.error("Greška u skripti", e);
  process.exit(1);
});