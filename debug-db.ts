import prisma from './src/lib/prisma';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    try {
        const allOrders = await prisma.order.findMany({
            include: { items: true }
        });
        console.log('Total Orders:', allOrders.length);

        const today = new Date().toISOString().slice(0, 10);
        const todayOrders = allOrders.filter(o => o.createdAt.toISOString().startsWith(today));
        console.log('Today Orders (UTC):', todayOrders.length);

        if (allOrders.length > 0) {
            console.log('Sample Order:', JSON.stringify(allOrders[0], null, 2));
        } else {
            console.log('No orders found in database.');
        }
    } catch (err) {
        console.error('Error fetching orders:', err);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
