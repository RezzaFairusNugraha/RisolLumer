"use client";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products";

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <div
            className="card p-5 flex flex-col items-center gap-3 cursor-pointer group overflow-hidden"
            style={{ backgroundColor: product.color }}
        >
            {/* Image Container */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-2 bg-white/50">
                <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                {/* Decorative Emoji Overlay */}
                <div className="absolute top-2 right-2 text-2xl drop-shadow-md">
                    {product.emoji}
                </div>
                {product.isMentah && (
                    <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm">
                        Frozen ❄️
                    </div>
                )}
            </div>

            {/* Name */}
            <h3 className="font-black text-base text-center text-gray-800">
                {product.name}
            </h3>

            {/* Prices */}
            <div className="w-full space-y-1">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">1 pcs</span>
                    <span className="font-bold text-primary">
                        Rp{product.price1.toLocaleString("id-ID")}
                    </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">Isi 3</span>
                    <span className="font-bold text-brown">
                        Rp{product.price3.toLocaleString("id-ID")}
                    </span>
                </div>
            </div>

            {/* CTA */}
            <Link
                href="/order"
                className="btn-primary w-full text-center text-sm py-2"
                id={`order-${product.id}`}
            >
                Pesan Sekarang
            </Link>
        </div>
    );
}
