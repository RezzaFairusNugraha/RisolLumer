import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const products = [
        { slug: "matcha-mentah", name: "Risol Matcha (Mentah)", emoji: "🍵", color: "#e8f5e9", price1: 5000, price3: 10000 },
        { slug: "chocolate-mentah", name: "Risol Chocolate (Mentah)", emoji: "🍫", color: "#faeeda", price1: 5000, price3: 10000 },
        { slug: "redvelvet-mentah", name: "Risol Red Velvet (Mentah)", emoji: "🎂", color: "#fbeaf0", price1: 5000, price3: 10000 },
        { slug: "mentai-mentah", name: "Risol Mentai (Mentah)", emoji: "🦑", color: "#faece7", price1: 5000, price3: 10000 },
    ];

    for (const p of products) {
        const r = await prisma.product.upsert({
            where: { slug: p.slug },
            update: { name: p.name, emoji: p.emoji, color: p.color, price1: p.price1, price3: p.price3, isMentah: true },
            create: { ...p, isMentah: true, isAvailable: true },
        });
        console.log("✅ Upserted:", r.slug, r.id);
    }

    // Verify all products
    const all = await prisma.product.findMany();
    console.log(`\nTotal products in DB: ${all.length}`);
    all.forEach(p => console.log(`  - ${p.slug} (available: ${p.isAvailable})`));

    await prisma.$disconnect();
    pool.end();
}

main().catch(console.error);
