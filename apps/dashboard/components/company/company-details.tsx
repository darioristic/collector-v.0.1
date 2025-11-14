"use client";

import {
	Building2,
	ExternalLink,
	Facebook,
	Globe,
	Instagram,
	Linkedin,
	Mail,
	MapPin,
	Phone,
	Twitter,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCompanySettings } from "@/app/(protected)/settings/company/use-company-settings";

/**
 * Company Details Component
 * 
 * Displays comprehensive company information including:
 * - Company name and logo
 * - Description/About section
 * - Contact information (email, phone, website, address)
 * - Company details (legal name, industry, employees, tax ID)
 * - Social media links
 * 
 * Features:
 * - Responsive design (mobile-first)
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Smooth transitions and hover states
 * - Loading states with skeletons
 */
export function CompanyDetails() {
	const { company, isLoading, error } = useCompanySettings();

	// Generate company initials for avatar fallback
	const companyInitials = useMemo(() => {
		if (!company?.name) return "CO";
		const words = company.name.trim().split(/\s+/);
		if (words.length >= 2) {
			return (words[0][0]?.toUpperCase() ?? "") + (words[1][0]?.toUpperCase() ?? "");
		}
		return company.name.substring(0, 2).toUpperCase();
	}, [company?.name]);

	// Format full address
	const fullAddress = useMemo(() => {
		if (!company) return null;
		const parts = [
			company.streetAddress,
			company.city,
			company.zipCode,
			company.country,
		].filter(Boolean);
		return parts.length > 0 ? parts.join(", ") : null;
	}, [company]);

	// Loading state
	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
						<Skeleton className="h-20 w-20 rounded-xl" />
						<div className="flex flex-1 flex-col gap-2">
							<Skeleton className="h-8 w-48 rounded-md" />
							<Skeleton className="h-4 w-64 rounded-md" />
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="space-y-4">
						<Skeleton className="h-4 w-full rounded-md" />
						<Skeleton className="h-4 w-3/4 rounded-md" />
					</div>
					<Separator />
					<div className="grid gap-4 sm:grid-cols-2">
						<Skeleton className="h-12 rounded-xl" />
						<Skeleton className="h-12 rounded-xl" />
						<Skeleton className="h-12 rounded-xl" />
						<Skeleton className="h-12 rounded-xl" />
					</div>
				</CardContent>
			</Card>
		);
	}

	// Error state
	if (error || !company) {
		return (
			<Card>
				<CardContent className="py-12 text-center">
					<p className="text-muted-foreground text-sm">
						{error instanceof Error
							? error.message
							: "Nije moguće učitati informacije o kompaniji."}
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				{/* Header Section: Logo and Company Name */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
					<Avatar className="h-20 w-20 rounded-xl border-2 border-border shadow-sm sm:h-24 sm:w-24">
						{company.logoUrl ? (
							<AvatarImage
								src={company.logoUrl}
								alt={`${company.name} logo`}
								className="object-cover"
							/>
						) : (
							<AvatarFallback className="bg-primary/10 text-primary rounded-xl text-2xl font-semibold">
								{companyInitials}
							</AvatarFallback>
						)}
					</Avatar>
					<div className="flex flex-1 flex-col gap-2">
						<h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
							{company.name}
						</h1>
						{company.legalName && company.legalName !== company.name && (
							<p className="text-muted-foreground text-sm">{company.legalName}</p>
						)}
						{company.industry && (
							<div className="flex flex-wrap items-center gap-2">
								<Badge variant="secondary" size="sm">
									{company.industry}
								</Badge>
							</div>
						)}
					</div>
				</div>
			</CardHeader>

			<CardContent className="space-y-6">
				{/* About/Description Section */}
				{company.description && (
					<section aria-labelledby="about-heading">
						<h2
							id="about-heading"
							className="text-foreground mb-3 text-base font-semibold"
						>
							O kompaniji
						</h2>
						<p className="text-muted-foreground leading-relaxed text-sm">
							{company.description}
						</p>
					</section>
				)}

				{/* Contact Information Section */}
				<section aria-labelledby="contact-heading">
					<h2
						id="contact-heading"
						className="text-foreground mb-4 text-base font-semibold"
					>
						Kontakt informacije
					</h2>
					<div className="grid gap-4 sm:grid-cols-2">
						{/* Email */}
						{company.email && (
							<ContactItem
								icon={Mail}
								label="Email"
								value={company.email}
								href={`mailto:${company.email}`}
								aria-label={`Pošaljite email na ${company.email}`}
							/>
						)}

						{/* Phone */}
						{company.phone && (
							<ContactItem
								icon={Phone}
								label="Telefon"
								value={company.phone}
								href={`tel:${company.phone}`}
								aria-label={`Pozovite ${company.phone}`}
							/>
						)}

						{/* Website */}
						{company.website && (
							<ContactItem
								icon={Globe}
								label="Website"
								value={company.website.replace(/^https?:\/\//, "")}
								href={company.website}
								isExternal
								aria-label={`Posetite website ${company.website}`}
							/>
						)}

						{/* Address */}
						{fullAddress && (
							<ContactItem
								icon={MapPin}
								label="Adresa"
								value={fullAddress}
								aria-label={`Adresa: ${fullAddress}`}
							/>
						)}
					</div>
				</section>

				{/* Company Details Section */}
				{(company.legalName ||
					company.registrationNo ||
					company.taxId ||
					company.employees) && (
					<>
						<Separator />
						<section aria-labelledby="details-heading">
							<h2
								id="details-heading"
								className="text-foreground mb-4 text-base font-semibold"
							>
								Detalji kompanije
							</h2>
							<div className="grid gap-4 sm:grid-cols-2">
								{company.registrationNo && (
									<DetailItem label="Registracioni broj" value={company.registrationNo} />
								)}
								{company.taxId && (
									<DetailItem label="PIB" value={company.taxId} />
								)}
								{company.employees !== null && company.employees !== undefined && (
									<DetailItem
										label="Broj zaposlenih"
										value={company.employees.toLocaleString()}
									/>
								)}
							</div>
						</section>
					</>
				)}

				{/* Social Media Links Section */}
				{/* Note: Social media links are not yet in the schema.
				    This section is prepared for future implementation.
				    When social media fields are added to the schema, uncomment and use:
				    company.facebookUrl, company.twitterUrl, company.linkedinUrl, company.instagramUrl */}
				{false && (
					<>
						<Separator />
						<section aria-labelledby="social-heading">
							<h2
								id="social-heading"
								className="text-foreground mb-4 text-base font-semibold"
							>
								Društvene mreže
							</h2>
							<div className="flex flex-wrap items-center gap-3">
								{/* Facebook */}
								{/* {company.facebookUrl && (
									<SocialMediaLink
										href={company.facebookUrl}
										icon={Facebook}
										label="Facebook"
										aria-label="Posetite našu Facebook stranicu"
									/>
								)} */}

								{/* Twitter/X */}
								{/* {company.twitterUrl && (
									<SocialMediaLink
										href={company.twitterUrl}
										icon={Twitter}
										label="Twitter"
										aria-label="Posetite našu Twitter stranicu"
									/>
								)} */}

								{/* LinkedIn */}
								{/* {company.linkedinUrl && (
									<SocialMediaLink
										href={company.linkedinUrl}
										icon={Linkedin}
										label="LinkedIn"
										aria-label="Posetite našu LinkedIn stranicu"
									/>
								)} */}

								{/* Instagram */}
								{/* {company.instagramUrl && (
									<SocialMediaLink
										href={company.instagramUrl}
										icon={Instagram}
										label="Instagram"
										aria-label="Posetite našu Instagram stranicu"
									/>
								)} */}
							</div>
						</section>
					</>
				)}
			</CardContent>
		</Card>
	);
}

/**
 * Contact Item Component
 * Displays a contact information item with icon and link
 */
interface ContactItemProps {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string;
	href?: string;
	isExternal?: boolean;
	"aria-label"?: string;
}

function ContactItem({
	icon: Icon,
	label,
	value,
	href,
	isExternal = false,
	"aria-label": ariaLabel,
}: ContactItemProps) {
	const content = (
		<div
			className={cn(
				"group flex items-start gap-3 rounded-lg border border-transparent p-3 transition-colors",
				href && "hover:bg-accent hover:border-border cursor-pointer",
			)}
		>
			<div className="bg-muted text-muted-foreground flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors group-hover:bg-primary/10 group-hover:text-primary">
				<Icon className="h-4 w-4" aria-hidden="true" />
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<span className="text-muted-foreground text-xs font-medium">{label}</span>
				<span className="text-foreground text-sm">{value}</span>
			</div>
			{isExternal && href && (
				<ExternalLink
					className="text-muted-foreground h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
					aria-hidden="true"
				/>
			)}
		</div>
	);

	if (href) {
		return (
			<Link
				href={href}
				target={isExternal ? "_blank" : undefined}
				rel={isExternal ? "noopener noreferrer" : undefined}
				aria-label={ariaLabel}
				className="block"
			>
				{content}
			</Link>
		);
	}

	return <div aria-label={ariaLabel}>{content}</div>;
}

/**
 * Detail Item Component
 * Displays a company detail with label and value
 */
interface DetailItemProps {
	label: string;
	value: string;
}

function DetailItem({ label, value }: DetailItemProps) {
	return (
		<div className="flex flex-col gap-1 rounded-lg border border-border bg-card/50 p-3">
			<span className="text-muted-foreground text-xs font-medium">{label}</span>
			<span className="text-foreground text-sm">{value}</span>
		</div>
	);
}

/**
 * Social Media Link Component
 * Displays a social media link with icon, hover states, and smooth transitions
 */
interface SocialMediaLinkProps {
	href: string;
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	"aria-label"?: string;
}

function SocialMediaLink({
	href,
	icon: Icon,
	label,
	"aria-label": ariaLabel,
}: SocialMediaLinkProps) {
	return (
		<Link
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={ariaLabel || `Posetite našu ${label} stranicu`}
			className="group relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
		>
			<Icon
				className="text-muted-foreground h-5 w-5 transition-colors group-hover:text-primary"
				aria-hidden="true"
			/>
			<span className="sr-only">{label}</span>
		</Link>
	);
}

