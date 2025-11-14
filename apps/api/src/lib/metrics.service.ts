import type { FastifyInstance, FastifyPluginAsync } from "fastify";

/**
 * Metrics collection service for tracking API performance
 */
export interface MetricsService {
	/**
	 * Record API response time
	 */
	recordResponseTime(route: string, method: string, statusCode: number, duration: number): void;

	/**
	 * Record cache hit
	 */
	recordCacheHit(key: string): void;

	/**
	 * Record cache miss
	 */
	recordCacheMiss(key: string): void;

	/**
	 * Record database query time
	 */
	recordQueryTime(query: string, duration: number): void;

	/**
	 * Get current metrics snapshot
	 */
	getMetrics(): MetricsSnapshot;

	/**
	 * Reset all metrics
	 */
	reset(): void;
}

export interface MetricsSnapshot {
	responseTimes: {
		total: number;
		average: number;
		p50: number;
		p95: number;
		p99: number;
		min: number;
		max: number;
		byRoute: Record<string, RouteMetrics>;
	};
	cache: {
		hits: number;
		misses: number;
		hitRate: number;
	};
	database: {
		queries: number;
		averageQueryTime: number;
		totalQueryTime: number;
	};
}

export interface RouteMetrics {
	count: number;
	average: number;
	p50: number;
	p95: number;
	p99: number;
	min: number;
	max: number;
	byStatusCode: Record<number, number>;
}

class InMemoryMetricsService implements MetricsService {
	private responseTimes: number[] = [];
	private responseTimesByRoute: Map<string, number[]> = new Map();
	private responseTimesByStatusCode: Map<number, number[]> = new Map();
	private cacheHits = 0;
	private cacheMisses = 0;
	private queryTimes: number[] = [];
	private queryCount = 0;

	recordResponseTime(route: string, method: string, statusCode: number, duration: number): void {
		this.responseTimes.push(duration);
		if (this.responseTimes.length > 10000) {
			// Keep only last 10000 measurements
			this.responseTimes = this.responseTimes.slice(-10000);
		}

		const routeKey = `${method} ${route}`;
		if (!this.responseTimesByRoute.has(routeKey)) {
			this.responseTimesByRoute.set(routeKey, []);
		}
		const routeTimes = this.responseTimesByRoute.get(routeKey)!;
		routeTimes.push(duration);
		if (routeTimes.length > 1000) {
			routeTimes.splice(0, routeTimes.length - 1000);
		}

		if (!this.responseTimesByStatusCode.has(statusCode)) {
			this.responseTimesByStatusCode.set(statusCode, []);
		}
		const statusTimes = this.responseTimesByStatusCode.get(statusCode)!;
		statusTimes.push(duration);
		if (statusTimes.length > 1000) {
			statusTimes.splice(0, statusTimes.length - 1000);
		}
	}

	recordCacheHit(_key: string): void {
		this.cacheHits++;
	}

	recordCacheMiss(_key: string): void {
		this.cacheMisses++;
	}

	recordQueryTime(_query: string, duration: number): void {
		this.queryTimes.push(duration);
		this.queryCount++;
		if (this.queryTimes.length > 10000) {
			this.queryTimes = this.queryTimes.slice(-10000);
		}
	}

	getMetrics(): MetricsSnapshot {
		const sorted = [...this.responseTimes].sort((a, b) => a - b);
		const total = sorted.length;

		const calculatePercentile = (arr: number[], percentile: number): number => {
			if (arr.length === 0) return 0;
			const index = Math.ceil((percentile / 100) * arr.length) - 1;
			return arr[Math.max(0, index)] ?? 0;
		};

		const routeMetrics: Record<string, RouteMetrics> = {};
		for (const [route, times] of this.responseTimesByRoute.entries()) {
			const sortedTimes = [...times].sort((a, b) => a - b);
			const routeTotal = sortedTimes.length;
			const statusCodeCounts: Record<number, number> = {};

			routeMetrics[route] = {
				count: routeTotal,
				average: routeTotal > 0 ? sortedTimes.reduce((a, b) => a + b, 0) / routeTotal : 0,
				p50: calculatePercentile(sortedTimes, 50),
				p95: calculatePercentile(sortedTimes, 95),
				p99: calculatePercentile(sortedTimes, 99),
				min: routeTotal > 0 ? sortedTimes[0] ?? 0 : 0,
				max: routeTotal > 0 ? sortedTimes[routeTotal - 1] ?? 0 : 0,
				byStatusCode: statusCodeCounts
			};
		}

		const totalCacheRequests = this.cacheHits + this.cacheMisses;
		const hitRate = totalCacheRequests > 0 ? this.cacheHits / totalCacheRequests : 0;

		const sortedQueryTimes = [...this.queryTimes].sort((a, b) => a - b);
		const totalQueryTime = sortedQueryTimes.reduce((a, b) => a + b, 0);
		const averageQueryTime =
			sortedQueryTimes.length > 0 ? totalQueryTime / sortedQueryTimes.length : 0;

		return {
			responseTimes: {
				total,
				average: total > 0 ? sorted.reduce((a, b) => a + b, 0) / total : 0,
				p50: calculatePercentile(sorted, 50),
				p95: calculatePercentile(sorted, 95),
				p99: calculatePercentile(sorted, 99),
				min: total > 0 ? sorted[0] ?? 0 : 0,
				max: total > 0 ? sorted[total - 1] ?? 0 : 0,
				byRoute: routeMetrics
			},
			cache: {
				hits: this.cacheHits,
				misses: this.cacheMisses,
				hitRate
			},
			database: {
				queries: this.queryCount,
				averageQueryTime,
				totalQueryTime
			}
		};
	}

	reset(): void {
		this.responseTimes = [];
		this.responseTimesByRoute.clear();
		this.responseTimesByStatusCode.clear();
		this.cacheHits = 0;
		this.cacheMisses = 0;
		this.queryTimes = [];
		this.queryCount = 0;
	}
}

let metricsInstance: MetricsService | null = null;

export const getMetricsService = (): MetricsService => {
	if (!metricsInstance) {
		metricsInstance = new InMemoryMetricsService();
	}
	return metricsInstance;
};

/**
 * Fastify plugin to register metrics service
 */
export const metricsPlugin: FastifyPluginAsync = async (fastify: FastifyInstance) => {
	const metrics = getMetricsService();

	if (!fastify.hasDecorator("metrics")) {
		fastify.decorate("metrics", metrics);
	}

	// Add onResponse hook to track response times
	fastify.addHook("onResponse", async (request, reply) => {
		const startTime = request.startTime;
		if (startTime) {
			const duration = Date.now() - startTime;
			const route = request.routerPath || request.url.split("?")[0];
			metrics.recordResponseTime(route, request.method, reply.statusCode, duration);
		}
	});

	// Add onRequest hook to record start time
	fastify.addHook("onRequest", async (request) => {
		request.startTime = Date.now();
	});
};

// Type augmentation for Fastify
declare module "fastify" {
	interface FastifyInstance {
		metrics: MetricsService;
	}

	interface FastifyRequest {
		startTime?: number;
	}
}

