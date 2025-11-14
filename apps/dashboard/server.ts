import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";

console.log("[server] ========================================");
console.log("[server] SERVER STARTING - Top level execution");
console.log("[server] ========================================");
console.log("[server] Starting server initialization...");
console.log("[server] Node version:", process.version);
console.log("[server] Process PID:", process.pid);
console.log("[server] Working directory:", process.cwd());

const bunGlobal = globalThis as unknown as { Bun?: { version?: string } };
const bunVersion =
	typeof bunGlobal.Bun !== "undefined"
		? bunGlobal.Bun.version || "unknown"
		: "N/A";
console.log("[server] Bun version:", bunVersion);
console.log("[server] All imports loaded successfully");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

// Use 0.0.0.0 to listen on all interfaces (required for socket.io and external access)
// But also bind to localhost explicitly
const listenHost = process.env.LISTEN_HOST || "0.0.0.0";

console.log("[server] Configuration:", {
	dev,
	hostname,
	port,
	listenHost,
	NODE_ENV: process.env.NODE_ENV,
});

console.log("[server] Initializing Next.js app...");
const app = next({ dev, hostname, port });
console.log("[server] Next.js app created, getting request handler...");
const handle = app.getRequestHandler();
console.log("[server] Next.js request handler obtained");
console.log("[server] Handle function type:", typeof handle);
console.log("[server] Next.js app initialized");

declare global {
	 
	var __server_initialized: boolean | undefined;
}

console.log("[server] ========================================");
console.log("[server] PREPARING NEXT.JS APP");
console.log("[server] ========================================");
console.log("[server] Calling app.prepare()...");

const preparePromise = app.prepare();
console.log("[server] app.prepare() called, waiting for promise...");

preparePromise
	.then(() => {
		console.log("[server] ========================================");
		console.log("[server] NEXT.JS APP PREPARED SUCCESSFULLY");
		console.log("[server] ========================================");
		console.log("[server] Verifying handle function:", typeof handle);
		console.log("[server] Handle function exists:", handle !== undefined && handle !== null);

		if (globalThis.__server_initialized) {
			console.log("[server] Server already initialized, skipping...");
			return;
		}
		
		if (!handle) {
			console.error("[server] ERROR: Handle function is not available!");
			process.exit(1);
		}

		console.log("[server] Creating HTTP server...");

		const httpServer = createServer((req, res) => {
			if (dev) {
				console.log(`[server] ========================================`);
				console.log(`[server] Incoming request: ${req.method} ${req.url}`);
			}

			// Add error handlers for req and res
			req.on("error", (err) => {
				console.error("[server] Request error:", err);
			});

			res.on("error", (err) => {
				console.error("[server] Response error:", err);
			});

			// Add timeout to prevent hanging requests
			const timeout = setTimeout(() => {
				if (!res.headersSent) {
					console.error(`[server] Request timeout after 30s: ${req.method} ${req.url}`);
					res.statusCode = 504;
					res.setHeader("Content-Type", "text/plain");
					res.end("Gateway Timeout");
				}
			}, 30000);

			try {
				if (!req.url) {
					console.error("[server] No URL in request");
					clearTimeout(timeout);
					res.statusCode = 400;
					res.end("bad request");
					return;
				}

				// Socket.io will intercept its own paths automatically
				// All other requests go to Next.js
				const parsedUrl = parse(req.url, true);
				if (dev) {
					console.log(`[server] Parsed URL pathname: ${parsedUrl.pathname}`);
					console.log(`[server] Calling Next.js handle()...`);
				}
				
				// Add response event listeners for debugging
				res.on("finish", () => {
					clearTimeout(timeout);
					if (dev) {
						console.log(`[server] Response finished: ${req.method} ${req.url} - Status: ${res.statusCode}`);
					}
				});
				
				res.on("close", () => {
					clearTimeout(timeout);
					if (dev) {
						console.log(`[server] Response closed: ${req.method} ${req.url}`);
					}
				});
				
				// Handle the request - Next.js handle() processes the request
				// In Next.js 16, handle() returns a promise that must be awaited
				(async () => {
					try {
						if (dev) {
							console.log(`[server] Calling Next.js handle() for ${req.method} ${parsedUrl.pathname}`);
						}
						
						// Next.js handle() always returns a promise in Next.js 16+
						const handleResult = handle(req, res, parsedUrl);
						
						// Wait for the promise to resolve
						if (handleResult && typeof handleResult.then === "function") {
							await handleResult;
							if (dev) {
								console.log(`[server] Next.js handle() promise resolved`);
							}
						}
					} catch (handleError: unknown) {
						console.error("[server] Next.js handle() error:", handleError);
						if (handleError instanceof Error) {
							console.error("[server] Error name:", handleError.name);
							console.error("[server] Error message:", handleError.message);
							console.error("[server] Error stack:", handleError.stack);
						}
						if (!res.headersSent) {
							res.statusCode = 500;
							res.setHeader("Content-Type", "text/plain");
							res.end("Internal Server Error");
						} else {
							console.error("[server] Headers already sent when error occurred");
						}
					}
				})();
			} catch (err) {
				console.error("[server] Error occurred handling", req.url, err);
				if (err instanceof Error) {
					console.error("[server] Error name:", err.name);
					console.error("[server] Error message:", err.message);
					console.error("[server] Error stack:", err.stack);
				}
				if (!res.headersSent) {
					res.statusCode = 500;
					res.end("internal server error");
				} else {
					console.error("[server] Headers already sent, cannot send error response");
				}
			}
		});

		console.log("[server] Socket.IO is handled by separate socket-server.ts");
		console.log("[server] Make sure socket-server is running on port 3001");

		globalThis.__server_initialized = true;
		console.log("[server] Server initialization flag set");

		console.log(`[server] ========================================`);
		console.log(`[server] STARTING HTTP SERVER`);
		console.log(`[server] ========================================`);
		console.log(`[server] Attempting to listen on ${listenHost}:${port}...`);
		console.log(`[server] Hostname: ${hostname}`);
		console.log(`[server] Port: ${port}`);
		console.log(`[server] Listen host: ${listenHost}`);

		// Add connection event listener for debugging
		if (dev) {
			httpServer.on("connection", (socket) => {
				console.log(
					`[server] ✓ New TCP connection from ${socket.remoteAddress}:${socket.remotePort}`,
				);
			});
		}

		// Add listening event BEFORE calling listen()
		httpServer.on("listening", () => {
			const address = httpServer.address();
			console.log(`[server] ========================================`);
			console.log(`[server] ✓ HTTP SERVER IS LISTENING`);
			console.log(`[server] ========================================`);
			console.log(`[server] Address:`, address);
			console.log(`[server] Server ready at http://${hostname}:${port}`);
			console.log(`[server] Also accessible at http://127.0.0.1:${port}`);
			console.log(`[server] Development mode: ${dev}`);
			console.log(`[server] Try opening: http://localhost:${port}/finance`);
			console.log(`[server] ========================================`);
		});

		httpServer
			.once("error", (err) => {
				console.error("[server] ✗ HTTP server error:", err);
				const errnoErr = err as NodeJS.ErrnoException;
				console.error("[server] Error details:", {
					code: errnoErr.code,
					errno: errnoErr.errno,
					syscall: errnoErr.syscall,
					address: "address" in errnoErr ? errnoErr.address : undefined,
					port: "port" in errnoErr ? errnoErr.port : undefined,
				});
				globalThis.__server_initialized = false;
				process.exit(1);
			})
			.listen(port, "0.0.0.0", () => {
				console.log(`[server] ✓ listen() callback executed`);
				console.log(`[server] Server listening on http://localhost:${port}`);
				console.log(`[server] Server listening on http://127.0.0.1:${port}`);
			});

		console.log(
			`[server] ✓ httpServer.listen() called - waiting for server to start...`,
		);
	})
	.catch((err) => {
		console.error("[server] ✗ Failed to prepare Next.js app:", err);
		if (err instanceof Error) {
			console.error("[server] Error name:", err.name);
			console.error("[server] Error message:", err.message);
			console.error("[server] Error stack:", err.stack);
		} else {
			console.error("[server] Unknown error type:", typeof err, err);
		}
		console.error("[server] ========================================");
		console.error("[server] FATAL ERROR - EXITING");
		console.error("[server] ========================================");
		console.error("[server] Exiting with code 1");
		process.exit(1);
	});

console.log("[server] ========================================");
console.log("[server] SERVER INITIALIZATION CODE COMPLETED");
console.log("[server] Waiting for async operations...");
console.log("[server] ========================================");
