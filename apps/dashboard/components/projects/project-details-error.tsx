"use client";

import { AlertCircle, RefreshCw, Undo2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode, UIEventHandler } from "react";
import { Component, Fragment } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProjectDetailsErrorBoundaryProps = {
	children: ReactNode;
	projectId: string;
};

type ProjectDetailsErrorBoundaryState = {
	error: Error | null;
};

export class ProjectDetailsErrorBoundary extends Component<
	ProjectDetailsErrorBoundaryProps,
	ProjectDetailsErrorBoundaryState
> {
	state: ProjectDetailsErrorBoundaryState = {
		error: null,
	};

	static getDerivedStateFromError(
		error: Error,
	): ProjectDetailsErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error("[ProjectDetails] ErrorBoundary caught error", error, info);
	}

	componentDidUpdate(prevProps: ProjectDetailsErrorBoundaryProps) {
		if (prevProps.projectId !== this.props.projectId && this.state.error) {
			this.resetErrorBoundary();
		}
	}

	private readonly handleRetry: UIEventHandler<HTMLButtonElement> = (event) => {
		event.preventDefault();
		this.resetErrorBoundary();
	};

	private resetErrorBoundary() {
		this.setState({ error: null });
	}

	render() {
		if (this.state.error) {
			return (
				<ProjectDetailsErrorState
					projectId={this.props.projectId}
					error={this.state.error}
					onRetry={this.handleRetry}
				/>
			);
		}

		return this.props.children;
	}
}

type ProjectDetailsNotFoundStateProps = {
	projectId?: string;
	variant?: "missing" | "invalid";
};

export function ProjectDetailsNotFoundState({
	projectId,
	variant = "missing",
}: ProjectDetailsNotFoundStateProps) {
	const router = useRouter();
	const pathname = usePathname();

	const title =
		variant === "invalid"
			? "ID projekta nije ispravan"
			: "Projekat nije pronađen";
	const description =
		variant === "invalid"
			? "Identifikator projekta ne odgovara očekivanom formatu. Proveri URL adresu i pokušaj ponovo."
			: "Projekat je verovatno uklonjen ili više nije dostupan. Proveri da li je ID ispravan ili pokušaj da osvežiš listu projekata.";

	return (
		<ProjectStatusShell
			title={title}
			description={description}
			badgeLabel={projectId ? `ID: ${projectId}` : undefined}
			actions={
				<Fragment>
					<Button
						onClick={() => router.push("/projects/list")}
						className="gap-2"
					>
						<Undo2 className="size-4" />
						Nazad na listu
					</Button>
					<Button
						variant="outline"
						onClick={() => router.refresh()}
						className="gap-2"
					>
						<RefreshCw className="size-4" />
						Osveži stranicu
					</Button>
				</Fragment>
			}
			technicalDetails={
				projectId
					? `Traženi projekat (${projectId}) nije pronađen. Putanja: ${pathname}`
					: `Traženi projekat nije pronađen. Putanja: ${pathname}`
			}
		/>
	);
}

type ProjectDetailsErrorStateProps = {
	error: Error;
	projectId: string;
	onRetry?: UIEventHandler<HTMLButtonElement>;
};

function ProjectDetailsErrorState({
	error,
	projectId,
	onRetry,
}: ProjectDetailsErrorStateProps) {
	const router = useRouter();
	const variant = resolveErrorVariant(error);

	const titleMap: Record<typeof variant, string> = {
		"not-found": "Projekat nije pronađen",
		offline: "Backend API nije dostupan",
		generic: "Došlo je do greške pri učitavanju projekta",
	};

	const descriptionMap: Record<typeof variant, string> = {
		"not-found":
			"Projekat je verovatno obrisan ili više nije dostupan. Proveri ID ili pokušaj da osvežiš listu projekata.",
		offline:
			"Ne mogu da dohvatim podatke sa backend API-ja. Proveri da li je serverska aplikacija pokrenuta i da li je promenljiva okruženja NEXT_PUBLIC_API_URL pravilno podešena.",
		generic:
			"Učitavanje detalja projekta nije uspelo. Pokušaj ponovo ili se vrati na listu projekata.",
	};

	const showRetry =
		variant !== "not-found" || error.message.toLowerCase().includes("timeout");

	return (
		<ProjectStatusShell
			title={titleMap[variant]}
			description={descriptionMap[variant]}
			badgeLabel={`ID: ${projectId}`}
			actions={
				<Fragment>
					<Button
						onClick={() => router.push("/projects/list")}
						className="gap-2"
					>
						<Undo2 className="size-4" />
						Nazad na listu
					</Button>
					{showRetry ? (
						<Button
							variant="outline"
							onClick={(event) => {
								onRetry?.(event);
								router.refresh();
							}}
							className="gap-2"
						>
							<RefreshCw className="size-4" />
							Pokušaj ponovo
						</Button>
					) : null}
				</Fragment>
			}
			technicalDetails={error.message}
		/>
	);
}

type ProjectStatusShellProps = {
	title: string;
	description: string;
	badgeLabel?: string;
	actions?: ReactNode;
	technicalDetails?: string;
	className?: string;
};

function ProjectStatusShell({
	title,
	description,
	badgeLabel,
	actions,
	technicalDetails,
	className,
}: ProjectStatusShellProps) {
	return (
		<motion.section
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.25 }}
			className={cn(
				"mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-2xl border border-border bg-card/80 px-6 py-12 text-center shadow-sm backdrop-blur",
				className,
			)}
		>
			<div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
				<AlertCircle className="size-6" aria-hidden />
			</div>
			<div className="space-y-3">
				<div className="space-y-1">
					<p className="font-display text-2xl font-semibold tracking-tight lg:text-3xl">
						{title}
					</p>
					<p className="text-muted-foreground text-sm leading-6">
						{description}
					</p>
				</div>
				{badgeLabel ? (
					<span className="inline-flex items-center rounded-full border border-border/80 bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{badgeLabel}
					</span>
				) : null}
			</div>
			{actions ? (
				<div className="flex flex-wrap justify-center gap-3">{actions}</div>
			) : null}
			{technicalDetails ? (
				<details className="group w-full rounded-xl border border-border/60 bg-muted/50 p-4 text-left text-sm text-muted-foreground">
					<summary className="cursor-pointer select-none font-semibold text-foreground">
						Tehničke informacije
					</summary>
					<pre className="mt-2 whitespace-pre-wrap break-words text-xs leading-6 text-muted-foreground/90">
						{technicalDetails}
					</pre>
					<div className="mt-3 rounded-md border border-border/50 bg-background/80 px-3 py-2">
						<p className="text-xs text-muted-foreground/90">
							Ako problem potraje, podeli ove informacije sa timom koji održava
							aplikaciju.
						</p>
					</div>
				</details>
			) : null}
			<div className="text-xs text-muted-foreground/70">
				Potreban ti je drugačiji pogled na projekte?{" "}
				<Link
					href="/projects/list"
					className="font-medium text-foreground underline underline-offset-4"
				>
					Otvori listu projekata
				</Link>
				.
			</div>
		</motion.section>
	);
}

function resolveErrorVariant(
	error: Error,
): "offline" | "not-found" | "generic" {
	const message = error.message.toLowerCase();

	// Check for status code in error object
	const status = (error as Error & { status?: number }).status;
	if (status === 404) {
		return "not-found";
	}

	if (message.includes("not found") || message.includes("404")) {
		return "not-found";
	}

	if (
		message.includes("ne mogu da uspostavim vezu") ||
		message.includes("failed to fetch") ||
		message.includes("network") ||
		message.includes("connection") ||
		status === 0 // Network error typically has status 0
	) {
		return "offline";
	}

	return "generic";
}
