export interface Product {
    id: string;
    name: string;
    emoji: string;
    image: string;
    color: string;
    price1: number;
    price3: number;
    isAvailable?: boolean;
}

export const PRODUCTS: Product[] = [
    { id: "matcha", name: "Risol Matcha", emoji: "🍵", image: "/img/RisolMatcha.jpeg", color: "#e8f5e9", price1: 5000, price3: 10000 },
    { id: "chocolate", name: "Risol Chocolate", emoji: "🍫", image: "/img/RisolCoklat.jpeg", color: "#faeeda", price1: 5000, price3: 10000 },
    { id: "redvelvet", name: "Risol Red Velvet", emoji: "🎂", image: "/img/RisolRedvelvet.jpeg", color: "#fbeaf0", price1: 5000, price3: 10000 },
    { id: "mentai", name: "Risol Mentai", emoji: "🦑", image: "/img/RisolMentai.jpeg", color: "#faece7", price1: 5000, price3: 10000 },
];
