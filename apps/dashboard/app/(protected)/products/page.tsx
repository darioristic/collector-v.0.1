import { PlusIcon } from "@radix-ui/react-icons";
import type { Metadata } from "next";
import Link from "next/link";
import ProductList, {
	type Product,
} from "@/app/(protected)/products/product-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { generateMeta } from "@/lib/utils";
import { type Product as ApiProduct, fetchProducts } from "./api";

export async function generateMetadata(): Promise<Metadata> {
	return generateMeta({
		title: "Product List",
		description:
			"Product list page created using Tanstack Table. List or filter products. Built with shadcn/ui, Tailwind CSS and Next.js.",
		canonical: "/products",
	});
}

function mapApiProductToComponent(apiProduct: ApiProduct): Product {
	return {
		id: parseInt(apiProduct.id.replace(/-/g, "").slice(0, 8), 16) || 0,
		name: apiProduct.name,
		image: undefined,
		description: undefined,
		category: apiProduct.category ?? undefined,
		sku: apiProduct.sku,
		stock: undefined,
		price: `${apiProduct.currency} ${apiProduct.price.toFixed(2)}`,
		rating: undefined,
		status: apiProduct.active ? "active" : "closed-for-sale",
	};
}

async function getProducts() {
	try {
		const response = await fetchProducts();
		return response.data.map(mapApiProductToComponent);
	} catch (error) {
		console.error("Failed to fetch products:", error);
		return [];
	}
}

export default async function Page() {
	const products = await getProducts();

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between space-y-2">
				<h1 className="text-2xl font-bold tracking-tight">Products</h1>
				<Button asChild>
					<Link href="/products/create">
						<PlusIcon /> Add Product
					</Link>
				</Button>
			</div>
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader>
						<CardDescription>Total Sales</CardDescription>
						<CardTitle className="font-display text-2xl lg:text-3xl">
							$30,230
						</CardTitle>
						<CardAction>
							<Badge variant="outline">
								<span className="text-green-600">+20.1%</span>
							</Badge>
						</CardAction>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Number of Sales</CardDescription>
						<CardTitle className="font-display text-2xl lg:text-3xl">
							982
						</CardTitle>
						<CardAction>
							<Badge variant="outline">
								<span className="text-green-600">+5.02</span>
							</Badge>
						</CardAction>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Affiliate</CardDescription>
						<CardTitle className="font-display text-2xl lg:text-3xl">
							$4,530
						</CardTitle>
						<CardAction>
							<Badge variant="outline">
								<span className="text-green-600">+3.1%</span>
							</Badge>
						</CardAction>
					</CardHeader>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Discounts</CardDescription>
						<CardTitle className="font-display text-2xl lg:text-3xl">
							$2,230
						</CardTitle>
						<CardAction>
							<Badge variant="outline">
								<span className="text-red-600">-3.58%</span>
							</Badge>
						</CardAction>
					</CardHeader>
				</Card>
			</div>
			<div className="pt-4">
				<ProductList data={products} />
			</div>
		</div>
	);
}
