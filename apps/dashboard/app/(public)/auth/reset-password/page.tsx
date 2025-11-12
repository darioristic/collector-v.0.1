"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

const resetSchema = z
	.object({
		token: z.string().min(16, "Token nije validan."),
		password: z.string().min(8, "Lozinka mora imati najmanje 8 karaktera."),
		confirmPassword: z
			.string()
			.min(8, "Lozinka mora imati najmanje 8 karaktera."),
	})
	.refine((values) => values.password === values.confirmPassword, {
		path: ["confirmPassword"],
		message: "Lozinke se ne poklapaju.",
	});

type ResetFormValues = z.infer<typeof resetSchema>;

export default function ResetPasswordPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const defaultToken = searchParams?.get("token") ?? "";

	const form = useForm<ResetFormValues>({
		resolver: zodResolver(resetSchema),
		defaultValues: {
			token: defaultToken,
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = async (values: ResetFormValues) => {
		const response = await fetch("/api/auth/reset-password", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				token: values.token,
				password: values.password,
			}),
		});

		const payload = await response.json().catch(() => null);

		if (!response.ok) {
			const message =
				(payload &&
					typeof payload === "object" &&
					"message" in payload &&
					payload.message) ||
				"Reset lozinke nije uspeo. Proverite token i pokušajte ponovo.";
			form.setError("token", { type: "manual", message: message as string });
			return;
		}

		toast.success("Lozinka uspešno promenjena! 🎉");
		router.replace("/finance");
		router.refresh();
	};

	return (
		<div className="flex items-center justify-center py-6 lg:h-screen">
			<Card className="mx-auto w-full max-w-md">
				<CardHeader>
					<CardTitle className="text-2xl">Reset lozinke</CardTitle>
					<CardDescription>
						Unesite token koji ste dobili i postavite novu lozinku.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="token"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Token</FormLabel>
										<FormControl>
											<Input {...field} placeholder="Nalepi token za reset" />
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
										<FormLabel>Nova lozinka</FormLabel>
										<FormControl>
											<Input
												type="password"
												autoComplete="new-password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="confirmPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Ponovi lozinku</FormLabel>
										<FormControl>
											<Input
												type="password"
												autoComplete="new-password"
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
								disabled={form.formState.isSubmitting}
								className="w-full"
							>
								{form.formState.isSubmitting
									? "Čuvam lozinku..."
									: "Promeni lozinku"}
							</Button>
						</form>
					</Form>

					<p className="mt-6 text-center text-sm text-muted-foreground">
						Treba ti novi token?{" "}
						<Link href="/auth/forgot-password" className="underline">
							Zatraži ponovo
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
