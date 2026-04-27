import prisma from './src/lib/prisma';
import * as dotenv from 'dotenv';

dotenv.config();

function calcTotal(items: { qty: number }[]): number {
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const bundles = Math.floor(totalQty / 3);
    const individual = totalQty % 3;
    return (bundles * 10000) + (individual * 5000);
}

async function testMixPromo() {
    const testCases = [
        { name: "3 Mixed", items: [{ qty: 2 }, { qty: 1 }], expected: 10000 },
        { name: "4 Mixed", items: [{ qty: 2 }, { qty: 2 }], expected: 15000 },
        { name: "6 Mixed", items: [{ qty: 3 }, { qty: 3 }], expected: 20000 },
        { name: "1 Single", items: [{ qty: 1 }], expected: 5000 },
    ];

    for (const tc of testCases) {
        const total = calcTotal(tc.items);
        console.log(`Test: ${tc.name} | Total: ${total} | ${total === tc.expected ? "✅ PASS" : "❌ FAIL (Expected " + tc.expected + ")"}`);
    }

    // Attempt to create a real mixed order in DB
    const mockOrder = {
        code: `RL-MIX-${Math.floor(Math.random() * 1000)}`,
        name: "Mix Test User",
        whatsapp: "628998877665",
        type: "ambil",
        items: [
            { productId: "matcha", qty: 2 },
            { productId: "chocolate", qty: 1 }
        ]
    };

    const products = await prisma.product.findMany();
    const productSlugMap = new Map(products.map(p => [p.slug, p.id]));
    const total = calcTotal(mockOrder.items);

    try {
        const order = await prisma.order.create({
            data: {
                code: mockOrder.code,
                name: mockOrder.name,
                whatsapp: mockOrder.whatsapp,
                type: mockOrder.type,
                total: total,
                status: "Baru",
                items: {
                    create: mockOrder.items.map((item: any) => ({
                        productId: productSlugMap.get(item.productId) || item.productId,
                        qty: item.qty,
                        packaging: "1pcs", // Always 1pcs now for individual storage
                    })),
                },
            },
        });
        console.log(`\nCreated real order in DB: ${order.code} | Total: ${order.total}`);
    } catch (e: any) {
        console.error("\nFailed to create DB order (expected in local environment):", e.message);
    }
}

testMixPromo()
    .finally(async () => {
        await prisma.$disconnect();
    });
