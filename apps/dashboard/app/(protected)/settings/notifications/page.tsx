"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { getApiUrl } from "@/src/lib/fetch-utils";

type NotificationPreferenceType =
	| "invoice"
	| "payment"
	| "transaction"
	| "daily_summary"
	| "quote"
	| "deal"
	| "project"
	| "task"
	| "system";

type NotificationPreference = {
	userId: string;
	notificationType: NotificationPreferenceType;
	emailEnabled: boolean;
	inAppEnabled: boolean;
};

const NOTIFICATION_TYPES: Array<{
	type: NotificationPreferenceType;
	label: string;
	description: string;
}> = [
	{
		type: "invoice",
		label: "Invoices",
		description: "Notifications when invoices are sent or updated",
	},
	{
		type: "payment",
		label: "Payments",
		description: "Notifications when payments are received",
	},
	{
		type: "transaction",
		label: "Transactions",
		description: "Notifications for new transactions",
	},
	{
		type: "daily_summary",
		label: "Daily Summary",
		description: "Daily summary of your activity",
	},
	{
		type: "quote",
		label: "Quotes",
		description: "Notifications when quotes are approved or updated",
	},
	{
		type: "deal",
		label: "Deals",
		description: "Notifications when deals are won or updated",
	},
	{
		type: "project",
		label: "Projects",
		description: "Notifications for project milestones and updates",
	},
	{
		type: "task",
		label: "Tasks",
		description: "Notifications when tasks are assigned or updated",
	},
	{
		type: "system",
		label: "System",
		description: "System alerts and important notifications",
	},
];

export default function NotificationsPage() {
	const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		loadPreferences();
	}, []);

	const loadPreferences = async () => {
		try {
			setIsLoading(true);
			const apiUrl = getApiUrl("/notifications/preferences");
			const response = await fetch(apiUrl, {
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				throw new Error("Failed to load preferences");
			}

			const data = await response.json();
			setPreferences(data.preferences || []);
		} catch (error) {
			console.error("Failed to load preferences:", error);
			toast.error("Failed to load notification preferences");
		} finally {
			setIsLoading(false);
		}
	};

	const updatePreference = async (
		type: NotificationPreferenceType,
		field: "emailEnabled" | "inAppEnabled",
		value: boolean,
	) => {
		const currentPref = preferences.find((p) => p.notificationType === type);
		const updatedPreferences = preferences.map((p) =>
			p.notificationType === type ? { ...p, [field]: value } : p,
		);

		// If preference doesn't exist, add it
		if (!currentPref) {
			updatedPreferences.push({
				userId: preferences[0]?.userId || "",
				notificationType: type,
				emailEnabled: field === "emailEnabled" ? value : true,
				inAppEnabled: field === "inAppEnabled" ? value : true,
			});
		}

		setPreferences(updatedPreferences);

		try {
			setIsSaving(true);
			const apiUrl = getApiUrl("/notifications/preferences");
			const response = await fetch(apiUrl, {
				method: "PATCH",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					preferences: updatedPreferences.map((p) => ({
						notificationType: p.notificationType,
						emailEnabled: p.emailEnabled,
						inAppEnabled: p.inAppEnabled,
					})),
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to update preferences");
			}

			toast.success("Notification preferences updated");
		} catch (error) {
			console.error("Failed to update preferences:", error);
			toast.error("Failed to update notification preferences");
			// Revert on error
			loadPreferences();
		} finally {
			setIsSaving(false);
		}
	};

	const getPreference = (
		type: NotificationPreferenceType,
	): NotificationPreference => {
		return (
			preferences.find((p) => p.notificationType === type) || {
				userId: "",
				notificationType: type,
				emailEnabled: true,
				inAppEnabled: true,
			}
		);
	};

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Notification Preferences</CardTitle>
					<CardDescription>
						Manage your notification preferences for different types of events.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="text-center py-8">Loading preferences...</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Notification Preferences</CardTitle>
				<CardDescription>
					Manage your notification preferences for different types of events.
					You can control whether to receive notifications via email or in-app
					for each type.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{NOTIFICATION_TYPES.map(({ type, label, description }, index) => {
					const pref = getPreference(type);
					return (
						<div key={type}>
							<div className="flex items-start justify-between space-x-4 rounded-lg border p-4">
								<div className="space-y-1 flex-1">
									<Label className="text-base font-medium">{label}</Label>
									<p className="text-sm text-muted-foreground">{description}</p>
								</div>
								<div className="flex flex-col gap-4">
									<div className="flex items-center space-x-2">
										<Label htmlFor={`${type}-email`} className="text-sm">
											Email
										</Label>
										<Switch
											id={`${type}-email`}
											checked={pref.emailEnabled}
											onCheckedChange={(checked) =>
												updatePreference(type, "emailEnabled", checked)
											}
											disabled={isSaving}
										/>
									</div>
									<div className="flex items-center space-x-2">
										<Label htmlFor={`${type}-inapp`} className="text-sm">
											In-App
										</Label>
										<Switch
											id={`${type}-inapp`}
											checked={pref.inAppEnabled}
											onCheckedChange={(checked) =>
												updatePreference(type, "inAppEnabled", checked)
											}
											disabled={isSaving}
										/>
									</div>
								</div>
							</div>
							{index < NOTIFICATION_TYPES.length - 1 && (
								<Separator className="my-4" />
							)}
						</div>
					);
				})}
			</CardContent>
		</Card>
	);
}
