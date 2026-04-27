import "dotenv/config";
import { defineConfig, env } from "@prisma/config";

export default defineConfig({
    datasource: {
        // Use DIRECT_URL for DB push/migrations if available, fallback to DATABASE_URL
        url: env("DIRECT_URL") || env("DATABASE_URL"),
    },
});
