"use client";

import { Building2, CalendarClock, Eye, FileText, FolderOpen, Globe, Loader2, Mail, MapPin, Phone } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetTitle
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type CompanyDrawerCompany = {
	id: string;
	name: string;
	email?: string | null;
	phone?: string | null;
	website?: string | null;
	legalName?: string | null;
	description?: string | null;
	type?: string | null;
	taxId: string;
	country: string;
	industry?: string | null;
	numberOfEmployees?: number | null;
	annualRevenueRange?: string | null;
	createdAt: string;
	updatedAt?: string | null;
	socialMediaLinks?: {
		linkedin?: string | null;
		facebook?: string | null;
		twitter?: string | null;
		instagram?: string | null;
	} | null;
	registrationNumber?: string | null;
	dateOfIncorporation?: string | null;
	legalStatus?: string | null;
	companyType?: string | null;
};

export type CompanyDrawerDetails = {
	addresses: Array<{
		id: string;
		label: string;
		street?: string | null;
		city?: string | null;
		state?: string | null;
		postalCode?: string | null;
		country?: string | null;
		latitude?: string | null;
		longitude?: string | null;
	}>;
	executives: Array<{
		id: string;
		name: string;
		title?: string | null;
		email?: string | null;
		phone?: string | null;
	}>;
	milestones: Array<{
		id: string;
		title: string;
		description?: string | null;
		date: string;
	}>;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const formatTag = (value?: string | null) =>
	value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

interface CompanyDrawerProps {
	open: boolean;
	company: CompanyDrawerCompany | null;
	details: CompanyDrawerDetails | null;
	isLoadingDetails?: boolean;
	onClose: () => void;
}

export default function CompanyDrawer({
	open,
	company,
	details,
	isLoadingDetails = false,
	onClose
}: CompanyDrawerProps) {
	return (
		<Sheet
			open={open && Boolean(company)}
			onOpenChange={(isOpen) => {
				if (!isOpen) {
					onClose();
				}
			}}
		>
			<SheetContent side="right" className="flex h-full w-full flex-col overflow-hidden border-l p-0 sm:max-w-xl">
				{company ? (
					<div className="flex h-full flex-col">
						<div className="border-b px-6 py-5">
							<div className="space-y-1">
								<SheetTitle className="text-2xl leading-tight font-semibold">
									Company Details
								</SheetTitle>
								<SheetDescription>
									Review profile, registration and recent activity for {company.name}.
								</SheetDescription>
							</div>
						</div>

						{isLoadingDetails ? (
							<div className="flex flex-1 items-center justify-center">
								<Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
							</div>
						) : (
							<ScrollArea className="h-[calc(100vh-200px)] flex-1">
								<Tabs defaultValue="overview" className="flex h-full flex-col gap-4 py-4">
									<div className="px-6">
										<TabsList className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
											<TabsTrigger value="overview" className="flex items-center gap-2">
												<Eye className="h-4 w-4" />
												Overview
											</TabsTrigger>
											<TabsTrigger value="profile" className="flex items-center gap-2">
												<Building2 className="h-4 w-4" />
												Profile
											</TabsTrigger>
											<TabsTrigger value="activity" className="flex items-center gap-2">
												<CalendarClock className="h-4 w-4" />
												Activity
											</TabsTrigger>
											<TabsTrigger value="files" className="flex items-center gap-2">
												<FolderOpen className="h-4 w-4" />
												Files
											</TabsTrigger>
										</TabsList>
									</div>

									<TabsContent value="overview" className="space-y-4 px-6 pb-4">
										<Card className="shadow-sm">
											<CardContent className="space-y-6 p-5">
												<div className="flex items-start gap-4">
													<div className="bg-primary/10 flex h-16 w-16 shrink-0 items-center justify-center rounded-lg">
														<Building2 className="text-primary h-8 w-8" />
													</div>
													<div className="flex-1 space-y-2">
														<div className="flex flex-wrap items-center gap-2">
															<p className="text-foreground text-xl leading-tight font-semibold">
																{company.name}
															</p>
															{company.type && (
																<Badge variant="secondary" className="capitalize">
																	{formatTag(company.type)}
																</Badge>
															)}
															{company.industry && (
																<Badge variant="outline" className="capitalize">
																	{company.industry}
																</Badge>
															)}
														</div>
														{company.legalName && (
															<p className="text-muted-foreground text-sm">{company.legalName}</p>
														)}
														{company.description && (
															<p className="text-muted-foreground text-sm leading-relaxed">
																{company.description}
															</p>
														)}
													</div>
												</div>
												<Separator />
												<dl className="grid gap-4 sm:grid-cols-2">
													{company.email && (
														<div className="flex items-start gap-3">
															<Mail className="text-muted-foreground mt-1 h-4 w-4" />
															<div>
																<dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
																	Email
																</dt>
																<dd className="text-foreground text-sm break-all">
																	<a className="hover:underline" href={`mailto:${company.email}`}>{company.email}</a>
																</dd>
															</div>
														</div>
													)}
													{company.phone && (
														<div className="flex items-start gap-3">
															<Phone className="text-muted-foreground mt-1 h-4 w-4" />
															<div>
																<dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
																	Phone
																</dt>
																<dd className="text-foreground text-sm">
																	<a className="hover:underline" href={`tel:${company.phone}`}>{company.phone}</a>
																</dd>
															</div>
														</div>
													)}
													{company.website && (
														<div className="flex items-start gap-3">
															<Globe className="text-muted-foreground mt-1 h-4 w-4" />
															<div>
																<dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
																	Website
																</dt>
																<dd className="text-foreground text-sm break-all">
																	<a
																		className="text-primary hover:underline"
																		href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
																		target="_blank"
																		rel="noopener noreferrer"
																	>
																		{company.website}
																	</a>
																</dd>
															</div>
														</div>
													)}
													<div className="flex items-start gap-3">
														<CalendarClock className="text-muted-foreground mt-1 h-4 w-4" />
														<div>
															<dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
																Created
															</dt>
															<dd className="text-foreground text-sm">
																{dateFormatter.format(new Date(company.createdAt))}
															</dd>
														</div>
													</div>
													<div className="flex items-start gap-3">
														<CalendarClock className="text-muted-foreground mt-1 h-4 w-4" />
														<div>
															<dt className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
																Updated
															</dt>
															<dd className="text-foreground text-sm">
																{dateFormatter.format(new Date(company.updatedAt ?? company.createdAt))}
															</dd>
														</div>
													</div>
												</dl>
												{details?.addresses?.length ? (
													<>
														<Separator />
														<div className="space-y-3">
															<Label className="text-muted-foreground text-xs">Addresses</Label>
															{details.addresses.map((address) => (
																<div key={address.id} className="border-border rounded-lg border p-3">
																	<div className="flex items-start gap-2">
																		<MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
																		<div className="min-w-0 flex-1 space-y-1">
																			{address.label && (
																				<Badge variant="outline" className="text-xs w-fit">{address.label}</Badge>
																			)}
																			<div className="text-foreground text-sm">
																				{address.street && <div>{address.street}</div>}
																				<div>
																					{address.city}
																					{address.state && `, ${address.state}`}
																					{address.postalCode && ` ${address.postalCode}`}
																				</div>
																				{address.country && <div>{address.country}</div>}
																			</div>
																		</div>
																	</div>
																</div>
															))}
														</div>
													</>
												) : null}
											</CardContent>
										</Card>

										<Card className="shadow-sm">
											<CardHeader>
												<CardTitle className="flex items-center gap-2 text-base">
													<FileText className="h-4 w-4" />
													Registration & Metadata
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-4">
												<div className="grid gap-4 md:grid-cols-2">
													<div className="space-y-1">
														<Label className="text-muted-foreground text-xs">Registration Number</Label>
														<p className="text-foreground text-sm font-medium">
															{company.registrationNumber ?? "—"}
														</p>
													</div>
													<div className="space-y-1">
														<Label className="text-muted-foreground text-xs">Tax ID</Label>
														<p className="text-foreground text-sm font-medium">{company.taxId}</p>
													</div>
													{company.dateOfIncorporation && (
														<div className="space-y-1">
															<Label className="text-muted-foreground text-xs">Date of Incorporation</Label>
															<p className="text-foreground text-sm font-medium">
																{dateFormatter.format(new Date(company.dateOfIncorporation))}
															</p>
														</div>
													)}
													<div className="space-y-1">
														<Label className="text-muted-foreground text-xs">Country</Label>
														<p className="text-foreground text-sm font-medium uppercase">
															{company.country}
														</p>
													</div>
													{company.legalStatus && (
														<div className="space-y-1">
															<Label className="text-muted-foreground text-xs">Legal Status</Label>
															<p className="text-foreground text-sm font-medium">{company.legalStatus}</p>
														</div>
													)}
													{company.companyType && (
														<div className="space-y-1">
															<Label className="text-muted-foreground text-xs">Company Type</Label>
															<p className="text-foreground text-sm font-medium">{company.companyType}</p>
														</div>
													)}
													{company.numberOfEmployees !== null && company.numberOfEmployees !== undefined && (
														<div className="space-y-1">
															<Label className="text-muted-foreground text-xs">Number of Employees</Label>
															<p className="text-foreground text-sm font-medium">
																{company.numberOfEmployees.toLocaleString()}
															</p>
														</div>
													)}
													{company.annualRevenueRange && (
														<div className="space-y-1">
															<Label className="text-muted-foreground text-xs">Annual Revenue Range</Label>
															<p className="text-foreground text-sm font-medium">{company.annualRevenueRange}</p>
														</div>
													)}
												</div>
											</CardContent>
										</Card>
									</TabsContent>

									<TabsContent value="profile" className="px-6 pb-4">
										<Card className="shadow-sm">
											<CardHeader>
												<CardTitle className="flex items-center gap-2 text-base">
													<Building2 className="h-4 w-4" />
													About
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-4 text-sm">
												<p className="text-muted-foreground">
													Use this space to keep additional context about the company and relationship.
												</p>
												<Button type="button" variant="secondary" size="sm">
													Add note
												</Button>
											</CardContent>
										</Card>
									</TabsContent>

									<TabsContent value="activity" className="px-6 pb-4">
										<Card className="shadow-sm">
											<CardHeader>
												<CardTitle className="flex items-center gap-2 text-base">
													<CalendarClock className="h-4 w-4" />
													Activity
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-4 text-sm">
												<p className="text-muted-foreground">
													Calls, emails, and tasks will appear here as activity tracking is connected.
												</p>
												<Button type="button" variant="outline" size="sm">
													Log activity
												</Button>
											</CardContent>
										</Card>
									</TabsContent>

									<TabsContent value="files" className="px-6 pb-4">
										<Card className="shadow-sm">
											<CardHeader>
												<CardTitle className="flex items-center gap-2 text-base">
													<FolderOpen className="h-4 w-4" />
													Files
												</CardTitle>
											</CardHeader>
											<CardContent className="space-y-4 text-sm">
												<p className="text-muted-foreground">
													Store proposals, contracts, and supporting documents for quick access.
												</p>
												<Button type="button" variant="outline" size="sm">
													Upload file
												</Button>
											</CardContent>
										</Card>
									</TabsContent>
								</Tabs>
							</ScrollArea>
						)}
					</div>
				) : null}
			</SheetContent>
		</Sheet>
	);
}
