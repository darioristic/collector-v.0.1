import { deals } from "../schema/deals";
import type { DashboardDatabase } from "./seed-runner";

type DealSeedData = {
	title: string;
	company: string;
	owner: string;
	stage:
		| "Lead"
		| "Qualified"
		| "Proposal"
		| "Negotiation"
		| "Closed Won"
		| "Closed Lost";
	value: number;
	closeDate?: Date;
	notes?: string;
};

const DEALS_DATA: DealSeedData[] = [
	{
		title: "Enterprise CRM Implementation",
		company: "TechCorp Solutions",
		owner: "Marko Petrović",
		stage: "Negotiation",
		value: 150000,
		closeDate: new Date("2024-12-31"),
		notes: "Veliki projekat za implementaciju CRM sistema sa 500+ korisnika",
	},
	{
		title: "E-commerce Platform Development",
		company: "RetailMax",
		owner: "Ana Marković",
		stage: "Proposal",
		value: 95000,
		closeDate: new Date("2024-11-30"),
		notes: "Razvoj kompleksne platforme za online prodaju sa integracijama",
	},
	{
		title: "Cloud Migration Project",
		company: "DataFlow Inc",
		owner: "Stefan Nikolić",
		stage: "Qualified",
		value: 120000,
		notes: "Migracija infrastrukture u AWS cloud sa zero-downtime pristupom",
	},
	{
		title: "Mobile App Development",
		company: "StartupHub",
		owner: "Jovana Jovanović",
		stage: "Lead",
		value: 45000,
		notes: "Razvoj mobilne aplikacije za iOS i Android sa backend sistemom",
	},
	{
		title: "Security Audit & Implementation",
		company: "SecureNet",
		owner: "Miloš Radović",
		stage: "Closed Won",
		value: 75000,
		closeDate: new Date("2024-10-15"),
		notes: "Bezbednosna revizija i implementacija najboljih praksi",
	},
	{
		title: "API Integration Services",
		company: "ConnectAPI",
		owner: "Ivana Tomić",
		stage: "Proposal",
		value: 35000,
		notes: "Integracija sa trećim stranama: Stripe, Twilio, SendGrid",
	},
	{
		title: "Data Analytics Dashboard",
		company: "AnalyticsPro",
		owner: "Marija Kostić",
		stage: "Negotiation",
		value: 55000,
		closeDate: new Date("2024-12-15"),
		notes: "Dashboard za analitiku podataka sa real-time ažuriranjima",
	},
	{
		title: "Legacy System Modernization",
		company: "OldTech Corp",
		owner: "Dragana Stanković",
		stage: "Qualified",
		value: 200000,
		notes: "Modernizacija zastarelog sistema sa migracijom podataka",
	},
	{
		title: "DevOps Automation Setup",
		company: "AutoDev",
		owner: "Sara Mladenović",
		stage: "Lead",
		value: 40000,
		notes: "Podešavanje DevOps automatizacije sa CI/CD pipeline-om",
	},
	{
		title: "Customer Portal Development",
		company: "CustomerFirst",
		owner: "Vladimir Milić",
		stage: "Closed Won",
		value: 65000,
		closeDate: new Date("2024-09-20"),
		notes: "Razvoj portala za klijente sa self-service funkcionalnostima",
	},
	{
		title: "AI-Powered Chatbot Integration",
		company: "SmartSupport",
		owner: "Marko Petrović",
		stage: "Proposal",
		value: 85000,
		notes: "Integracija AI chatbot-a za customer support",
	},
	{
		title: "Blockchain Payment System",
		company: "CryptoPay",
		owner: "Ana Marković",
		stage: "Lead",
		value: 180000,
		notes: "Razvoj blockchain-based payment sistema",
	},
	{
		title: "IoT Device Management Platform",
		company: "IoT Solutions",
		owner: "Stefan Nikolić",
		stage: "Qualified",
		value: 140000,
		notes: "Platforma za upravljanje IoT uređajima sa monitoringom",
	},
	{
		title: "Video Streaming Service",
		company: "StreamHub",
		owner: "Jovana Jovanović",
		stage: "Negotiation",
		value: 220000,
		closeDate: new Date("2025-01-31"),
		notes: "Razvoj video streaming servisa sa CDN integracijom",
	},
	{
		title: "Healthcare Management System",
		company: "HealthTech",
		owner: "Miloš Radović",
		stage: "Closed Won",
		value: 175000,
		closeDate: new Date("2024-08-10"),
		notes: "Sistem za upravljanje zdravstvenim ustanovama sa HIPAA compliance",
	},
	{
		title: "Real Estate Platform",
		company: "PropertyPro",
		owner: "Ivana Tomić",
		stage: "Proposal",
		value: 110000,
		notes: "Platforma za upravljanje nekretninama sa virtual tours",
	},
	{
		title: "Supply Chain Management",
		company: "LogisticsPlus",
		owner: "Marija Kostić",
		stage: "Qualified",
		value: 195000,
		notes:
			"Sistem za upravljanje supply chain-om sa tracking funkcionalnostima",
	},
	{
		title: "Educational LMS Platform",
		company: "EduTech",
		owner: "Dragana Stanković",
		stage: "Negotiation",
		value: 125000,
		closeDate: new Date("2025-02-28"),
		notes: "Learning Management System sa video kursovima i testovima",
	},
	{
		title: "Social Media Analytics Tool",
		company: "SocialMetrics",
		owner: "Sara Mladenović",
		stage: "Lead",
		value: 60000,
		notes: "Analitički alat za praćenje performansi na društvenim mrežama",
	},
	{
		title: "Fitness Tracking App",
		company: "FitLife",
		owner: "Vladimir Milić",
		stage: "Closed Lost",
		value: 50000,
		notes: "Aplikacija za praćenje fitnes aktivnosti - projekat otkazan",
	},
	{
		title: "Financial Planning Software",
		company: "FinancePro",
		owner: "Marko Petrović",
		stage: "Proposal",
		value: 90000,
		notes: "Software za finansijsko planiranje sa AI preporukama",
	},
];

type DealsSeedResult = {
	inserted: number;
	skipped: number;
};

export async function seedDeals(
	db: DashboardDatabase,
	options: { force?: boolean } = {},
): Promise<DealsSeedResult> {
	if (options.force) {
		await db.delete(deals);
	}

	const existingDeals = await db.select({ id: deals.id }).from(deals);
	const existingCount = existingDeals.length;

	if (existingCount > 0 && !options.force) {
		return {
			inserted: 0,
			skipped: DEALS_DATA.length,
		};
	}

	await db.insert(deals).values(
		DEALS_DATA.map((deal) => ({
			title: deal.title,
			company: deal.company,
			owner: deal.owner,
			stage: deal.stage,
			value: deal.value,
			closeDate: deal.closeDate ?? null,
			notes: deal.notes ?? null,
		})),
	);

	return {
		inserted: DEALS_DATA.length,
		skipped: 0,
	};
}
