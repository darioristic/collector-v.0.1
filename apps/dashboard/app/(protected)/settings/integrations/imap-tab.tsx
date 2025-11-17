"use client";

import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

type ImapSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  syncEmails: boolean;
  syncContacts: boolean;
  syncCalendar: boolean;
  folders?: string[];
  intervalSeconds?: number;
};

type ImapStatus = { connected?: boolean; lastSync?: string; message?: string };
async function apiGetStatus(): Promise<ImapStatus> {
  const res = await fetch("/api/integrations/imap/status", { cache: "no-store" });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data.error || data.message)) || "Failed to fetch IMAP status";
    throw new Error(message);
  }

  return (data || {}) as ImapStatus;
}

async function apiSaveSettings(payload: ImapSettings): Promise<{ ok: boolean }> {
  const res = await fetch("/api/integrations/imap/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || (data && (data as { ok?: boolean }).ok === false)) {
    const message =
      (data && (data as { error?: string; message?: string }).error) ||
      (data && (data as { error?: string; message?: string }).message) ||
      "Failed to save IMAP settings";
    throw new Error(message);
  }

  return (data || { ok: true }) as { ok: boolean };
}

async function apiConnect(): Promise<{ ok: boolean; mailboxes?: Array<{ path: string; flags: string[] }> }> {
  const res = await fetch("/api/integrations/imap/connect", { method: "POST" });
  const data = await res.json().catch(() => null);

  if (!res.ok || (data && (data as { ok?: boolean }).ok === false)) {
    const message =
      (data && (data as { error?: string; message?: string }).error) ||
      (data && (data as { error?: string; message?: string }).message) ||
      "Failed to connect IMAP";
    throw new Error(message);
  }

  return (data || { ok: true }) as {
    ok: boolean;
    mailboxes?: Array<{ path: string; flags: string[] }>;
  };
}

async function apiSync(): Promise<{ ok: boolean; lastSync?: string }> {
  const res = await fetch("/api/integrations/imap/sync", { method: "POST" });
  const data = await res.json().catch(() => null);

  if (!res.ok || (data && (data as { ok?: boolean }).ok === false)) {
    const message =
      (data && (data as { error?: string; message?: string }).error) ||
      (data && (data as { error?: string; message?: string }).message) ||
      "Failed to sync IMAP";
    throw new Error(message);
  }

  return (data || { ok: true }) as { ok: boolean; lastSync?: string };
}

type SmtpSettings = {
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
};

type SmtpStatus = { connected?: boolean; lastSend?: string; message?: string };
async function apiGetSmtpStatus(): Promise<SmtpStatus> {
  const res = await fetch("/api/integrations/smtp/status", { cache: "no-store" });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data as { error?: string; message?: string }).error) ||
      (data && (data as { error?: string; message?: string }).message) ||
      "Failed to fetch SMTP status";
    throw new Error(message);
  }

  return (data || {}) as SmtpStatus;
}

async function apiSaveSmtpSettings(payload: SmtpSettings): Promise<{ ok: boolean }> {
  const res = await fetch("/api/integrations/smtp/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || (data && (data as { ok?: boolean }).ok === false)) {
    const message =
      (data && (data as { error?: string; message?: string }).error) ||
      (data && (data as { error?: string; message?: string }).message) ||
      "Failed to save SMTP settings";
    throw new Error(message);
  }

  return (data || { ok: true }) as { ok: boolean };
}

async function apiSendTestEmail(to: string): Promise<{ ok: boolean; messageId?: string }> {
  const res = await fetch("/api/integrations/smtp/send-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to })
  });
  const data = await res.json().catch(() => null);

  if (!res.ok || (data && (data as { ok?: boolean }).ok === false)) {
    const message =
      (data && (data as { error?: string; message?: string }).error) ||
      (data && (data as { error?: string; message?: string }).message) ||
      "Failed to send SMTP test email";
    throw new Error(message);
  }

  return (data || { ok: true }) as { ok: boolean; messageId?: string };
}

export default function ImapTab() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<ImapSettings>({
    host: "",
    port: 993,
    secure: true,
    username: "",
    password: "",
    syncEmails: true,
    syncContacts: true,
    syncCalendar: true,
    folders: ["INBOX"],
    intervalSeconds: 600
  });

  const [smtpSettings, setSmtpSettings] = React.useState<SmtpSettings>({
    host: "",
    port: 587,
    secure: false,
    username: "",
    password: "",
    fromEmail: ""
  });
  const [smtpTestTo, setSmtpTestTo] = React.useState<string>("");

  const { data: statusData, refetch: refetchStatus, isFetching: statusLoading } = useQuery({
    queryKey: ["imap-status"],
    queryFn: apiGetStatus
  });

  const { data: smtpStatus, refetch: refetchSmtpStatus, isFetching: smtpStatusLoading } = useQuery({
    queryKey: ["smtp-status"],
    queryFn: apiGetSmtpStatus
  });

  const saveMutation = useMutation({
    mutationFn: apiSaveSettings,
    onSuccess: () => {
      toast({ title: "Settings saved" });
      refetchStatus();
    },
    onError: (error: unknown) =>
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive"
      })
  });

  const connectMutation = useMutation({
    mutationFn: apiConnect,
    onSuccess: () => {
      toast({ title: "Connected to IMAP" });
      refetchStatus();
    },
    onError: (error: unknown) =>
      toast({
        title: "Failed to connect",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive"
      })
  });

  const syncMutation = useMutation({
    mutationFn: apiSync,
    onSuccess: () => {
      toast({ title: "Sync triggered" });
      refetchStatus();
    },
    onError: (error: unknown) =>
      toast({
        title: "Failed to sync",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive"
      })
  });

  const saveSmtpMutation = useMutation({
    mutationFn: apiSaveSmtpSettings,
    onSuccess: () => {
      toast({ title: "SMTP settings saved" });
      refetchSmtpStatus();
    },
    onError: (error: unknown) =>
      toast({
        title: "Failed to save SMTP settings",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive"
      })
  });

  const sendTestMutation = useMutation({
    mutationFn: apiSendTestEmail,
    onSuccess: () => {
      toast({ title: "Test email sent" });
      refetchSmtpStatus();
    },
    onError: (error: unknown) =>
      toast({
        title: "Failed to send test email",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive"
      })
  });

  return (
    <Card className="border-none bg-transparent shadow-none">
      <div className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-foreground">IMAP Integration</h2>
          <p className="text-sm text-muted-foreground">
            Configure your IMAP connection for syncing emails, contacts and calendar.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Host</Label>
            <Input
              placeholder="imap.example.com"
              value={settings.host}
              onChange={(e) => setSettings((s) => ({ ...s, host: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Port</Label>
            <Input
              type="number"
              placeholder="993"
              value={String(settings.port)}
              onChange={(e) => setSettings((s) => ({ ...s, port: Number(e.target.value || 0) }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={settings.secure} onCheckedChange={(v) => setSettings((s) => ({ ...s, secure: v }))} />
            <Label>Use SSL/TLS</Label>
          </div>
          <div />
          <div className="flex flex-col gap-2">
            <Label>Username</Label>
            <Input value={settings.username} onChange={(e) => setSettings((s) => ({ ...s, username: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Password</Label>
            <Input type="password" value={settings.password} onChange={(e) => setSettings((s) => ({ ...s, password: e.target.value }))} />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <Switch checked={settings.syncEmails} onCheckedChange={(v) => setSettings((s) => ({ ...s, syncEmails: v }))} />
            <Label>Sync Emails</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={settings.syncContacts} onCheckedChange={(v) => setSettings((s) => ({ ...s, syncContacts: v }))} />
            <Label>Sync Contacts</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={settings.syncCalendar} onCheckedChange={(v) => setSettings((s) => ({ ...s, syncCalendar: v }))} />
            <Label>Sync Calendar</Label>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Folders (comma separated)</Label>
            <Input
              placeholder="INBOX,Sent"
              value={(settings.folders || []).join(",")}
              onChange={(e) => setSettings((s) => ({ ...s, folders: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Refresh Interval (seconds)</Label>
            <Input
              type="number"
              placeholder="600"
              value={String(settings.intervalSeconds || "")}
              onChange={(e) => setSettings((s) => ({ ...s, intervalSeconds: Number(e.target.value || 0) }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              if (!settings.host || !settings.username || !settings.password) {
                toast({
                  title: "Validation error",
                  description: "Please fill in all required fields (host, username, password)",
                  variant: "destructive"
                });
                return;
              }
              saveMutation.mutate(settings);
            }}
            disabled={saveMutation.isPending}>
            Save settings
          </Button>
          <Button variant="secondary" onClick={() => connectMutation.mutate()} disabled={connectMutation.isPending}>Connect</Button>
          <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>Sync now</Button>
        </div>

        <Separator />

        <div className="text-sm text-muted-foreground">
          <div>Status: {statusLoading ? "Loading..." : statusData?.connected ? "Connected" : "Disconnected"}</div>
          <div>Last sync: {statusData?.lastSync || "—"}</div>
          {statusData?.message && (
            <div className={`mt-1 ${statusData.connected ? "text-green-600" : "text-red-600"}`}>
              {statusData.message}
            </div>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-foreground">SMTP</h2>
          <p className="text-sm text-muted-foreground">Configure SMTP for sending emails.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>Host</Label>
            <Input
              placeholder="smtp.example.com"
              value={smtpSettings.host}
              onChange={(e) => setSmtpSettings((s) => ({ ...s, host: e.target.value }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Port</Label>
            <Input
              type="number"
              placeholder="587"
              value={String(smtpSettings.port)}
              onChange={(e) => setSmtpSettings((s) => ({ ...s, port: Number(e.target.value || 0) }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={smtpSettings.secure} onCheckedChange={(v) => setSmtpSettings((s) => ({ ...s, secure: v }))} />
            <Label>Use SSL/TLS</Label>
          </div>
          <div />
          <div className="flex flex-col gap-2">
            <Label>Username</Label>
            <Input value={smtpSettings.username} onChange={(e) => setSmtpSettings((s) => ({ ...s, username: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Password</Label>
            <Input type="password" value={smtpSettings.password} onChange={(e) => setSmtpSettings((s) => ({ ...s, password: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label>From Email</Label>
            <Input placeholder="noreply@example.com" value={smtpSettings.fromEmail} onChange={(e) => setSmtpSettings((s) => ({ ...s, fromEmail: e.target.value }))} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password || !smtpSettings.fromEmail) {
                toast({
                  title: "Validation error",
                  description: "Please fill in all required fields (host, username, password, from email)",
                  variant: "destructive"
                });
                return;
              }
              saveSmtpMutation.mutate(smtpSettings);
            }}
            disabled={saveSmtpMutation.isPending}>
            Save SMTP
          </Button>
          <div className="flex items-center gap-3">
            <Input placeholder="recipient@example.com" value={smtpTestTo} onChange={(e) => setSmtpTestTo(e.target.value)} />
            <Button variant="secondary" onClick={() => sendTestMutation.mutate(smtpTestTo)} disabled={sendTestMutation.isPending || !smtpTestTo}>Send test</Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <div>SMTP Status: {smtpStatusLoading ? "Loading..." : smtpStatus?.connected ? "Connected" : "Disconnected"}</div>
          <div>Last send: {smtpStatus?.lastSend || "—"}</div>
          {smtpStatus?.message && (
            <div className={`mt-1 ${smtpStatus.connected ? "text-green-600" : "text-red-600"}`}>
              {smtpStatus.message}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
