import prisma from './src/lib/prisma';
import * as dotenv from 'dotenv';

dotenv.config();

async function testOrder() {
    const mockData = {
        code: `RL-TEST-${Math.floor(Math.random() * 1000)}`,
        name: "Test User",
        whatsapp: "628123456789",
        type: "ambil",
        total: 15000,
        items: [
            { productId: "matcha", qty: 1, packaging: "isi3" },
            { productId: "chocolate", qty: 1, packaging: "1pcs" }
        ]
    };

    console.log("Creating test order...");

    // Logic from API route
    const products = await prisma.product.findMany();
    const productSlugMap = new Map(products.map(p => [p.slug, p.id]));

    try {
        const order = await prisma.order.create({
            data: {
                code: mockData.code,
                name: mockData.name,
                whatsapp: mockData.whatsapp,
                type: mockData.type,
                total: mockData.total,
                status: "Baru",
                items: {
                    create: mockData.items.map((item: any) => ({
                        productId: productSlugMap.get(item.productId) || item.productId,
                        qty: item.qty,
                        packaging: item.packaging,
                    })),
                },
            },
            include: {
                items: true,
            },
        });
        console.log("Order created successfully:", order.code);
        console.log("Items:", JSON.stringify(order.items, null, 2));
    } catch (error) {
        console.error("Failed to create order:", error);
    }
}

testOrder()
    .finally(async () => {
        await prisma.$disconnect();
    });
