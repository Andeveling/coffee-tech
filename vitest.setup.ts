const requiredEnv: Record<string, string> = {
	DATABASE_URL: "file:./local.db",
	BETTER_AUTH_SECRET: "test-secret-must-be-at-least-32-chars-long-x",
	BETTER_AUTH_URL: "http://localhost:3000",
	NODE_ENV: "test",
	NEXT_PUBLIC_APP_URL: "http://localhost:3000",
};

for (const [key, value] of Object.entries(requiredEnv)) {
	if (process.env[key] === undefined) {
		process.env[key] = value;
	}
}
