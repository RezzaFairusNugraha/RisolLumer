"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
    { href: "/", label: "Beranda" },
    { href: "/order", label: "Order" },
    { href: "/afiliasi", label: "Afiliasi" },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const pathname = usePathname();

    return (
        <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md shadow-sm">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl">🫓</span>
                        <span className="text-xl font-black text-primary">Risol Lumer</span>
                    </Link>

                    {/* Desktop menu */}
                    <div className="hidden md:flex items-center gap-8">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`font-bold text-base transition-colors duration-200 hover:text-primary ${pathname === item.href
                                        ? "text-primary border-b-2 border-primary"
                                        : "text-gray-600"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href="/order"
                            className="btn-primary text-sm py-2 px-5"
                        >
                            Order via WA
                        </Link>
                    </div>

                    {/* Hamburger */}
                    <button
                        id="hamburger-btn"
                        aria-label="Toggle menu"
                        className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        onClick={() => setMenuOpen((v) => !v)}
                    >
                        <span className="text-2xl">{menuOpen ? "✕" : "☰"}</span>
                    </button>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="md:hidden animate-slide-down border-t border-gray-100 pb-4">
                        {NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={`block py-3 px-2 font-bold text-base transition-colors duration-200 hover:text-primary ${pathname === item.href ? "text-primary" : "text-gray-600"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href="/order"
                            onClick={() => setMenuOpen(false)}
                            className="btn-primary block text-center mt-3"
                        >
                            Order via WA 🫓
                        </Link>
                    </div>
                )}
            </div>
        </nav>
    );
}
