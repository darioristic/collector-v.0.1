"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const loginSchema = z.object({
	email: z.string().email("Please enter a valid email."),
	password: z.string().min(8, "Password must be at least 8 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEFAULT_REDIRECT = "/dashboard";

const formError = (message: string) =>
	({
		type: "manual",
		message,
	}) as const;

const SocialButtons = () => (
	<div className="grid grid-cols-1 gap-3">
		<Button variant="outline" className="w-full" disabled>
			<svg viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
				/>
				<path
					fill="currentColor"
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
				/>
				<path
					fill="currentColor"
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
				/>
				<path
					fill="currentColor"
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
				/>
			</svg>
			Google (coming soon)
		</Button>
		<Button variant="outline" className="w-full" disabled>
			<GitHubLogoIcon />
			GitHub (coming soon)
		</Button>
	</div>
);

export default function LoginPage() {
	const router = useRouter();
	const [redirectTo, setRedirectTo] = useState(DEFAULT_REDIRECT);
	const [isDevelopment, setIsDevelopment] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const params = new URLSearchParams(window.location.search);
			const redirect = params.get("redirect");
			if (redirect) {
				setRedirectTo(redirect);
			}
			// Check if we're in development mode
			setIsDevelopment(
				window.location.hostname === "localhost" ||
					window.location.hostname === "127.0.0.1",
			);
		}
	}, []);

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (values: LoginFormValues) => {
		form.clearErrors("root");

		const response = await fetch("/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(values),
		});

		const payload = await response.json().catch(() => null);

		if (!response.ok) {
			const message =
				(payload &&
					typeof payload === "object" &&
					"message" in payload &&
					payload.message) ||
				"Login failed. Please check your credentials and try again.";

			form.setError("root", formError(message as string));
			return;
		}

		toast.success("Welcome back! 🥳");
		router.push(redirectTo);
	};

	return (
		<div className="flex items-center justify-center py-4 lg:h-screen">
			<Card className="mx-auto w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">Login</CardTitle>
					<CardDescription>
						Enter your email and password to access the dashboard.
					</CardDescription>
					{isDevelopment && (
						<div className="mt-4 rounded-md bg-muted p-3 text-xs">
							<p className="font-semibold mb-2">Test users:</p>
							<ul className="space-y-1 text-muted-foreground">
								<li>• dario@collectorlabs.test (admin)</li>
								<li>• miha@collectorlabs.test (manager)</li>
								<li>• tara@collectorlabs.test (user)</li>
							</ul>
							<p className="mt-2 text-muted-foreground">
								Password: Collector!2025
							</p>
						</div>
					)}
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email address</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="dario@collectorlabs.test"
												autoComplete="email"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center">
											<FormLabel>Password</FormLabel>
											<Link
												href="/auth/forgot-password"
												className="ml-auto text-sm underline"
											>
												Forgot password?
											</Link>
										</div>
										<FormControl>
											<Input
												type="password"
												autoComplete="current-password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{form.formState.errors.root ? (
								<p className="text-sm font-medium text-destructive">
									{form.formState.errors.root.message}
								</p>
							) : null}

							<Button
								type="submit"
								className="w-full"
								disabled={form.formState.isSubmitting}
							>
								{form.formState.isSubmitting ? "Signing in..." : "Sign in"}
							</Button>
						</form>
					</Form>

					<div className="my-4">
						<div className="flex items-center gap-3">
							<div className="w-full border-t" />
							<span className="shrink-0 text-sm text-muted-foreground">
								or continue with
							</span>
							<div className="w-full border-t" />
						</div>
					</div>

					<SocialButtons />

					<div className="mt-4 text-center text-sm">
						Don't have an account?{" "}
						<Link href="/auth/register" className="underline">
							Sign up
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
