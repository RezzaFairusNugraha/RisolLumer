import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { PRODUCTS } from "@/lib/products";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
    const heroImage = PRODUCTS.find((p) => p.id === "matcha")?.image || "/img/RisolMatcha.jpeg";

    return (
        <div className="min-h-screen bg-cream">
            <Navbar />

            {/* ===== HERO ===== */}
            <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-16 py-12 md:py-20 overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
                    {/* Text */}
                    <div className="flex-1 text-center md:text-left z-10">
                        <div className="inline-block bg-primary/10 text-primary font-bold text-sm px-4 py-2 rounded-full mb-4">
                            🫓 Homemade with Love
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-800 mb-4 leading-tight">
                            Risol <span className="text-primary">Lumer</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-gray-600 font-medium mb-8 max-w-md mx-auto md:mx-0">
                            &ldquo;Lumer di mulut, awet di hati 🫓&rdquo;
                        </p>
                        <p className="text-gray-600 mb-8 max-w-sm mx-auto md:mx-0">
                            Risol premium homemade berbagai varian rasa yang bikin nagih.
                            Tersedia dalam kemasan 1 pcs &amp; isi 3!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Link href="/order" id="hero-order-btn" className="btn-primary text-center">
                                🛒 Pesan Sekarang
                            </Link>
                            <Link href="/afiliasi" id="hero-afiliasi-btn" className="btn-outline text-center">
                                🎁 Cek Afiliasi
                            </Link>
                        </div>
                    </div>

                    {/* Hero Image Illustration */}
                    <div className="flex-shrink-0 flex items-center justify-center relative">
                        <div className="relative w-72 h-72 lg:w-96 lg:h-96">
                            {/* Background Glow */}
                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-110 animate-pulse" />

                            {/* Main Image Container */}
                            <div className="relative w-full h-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white transform rotate-3 hover:rotate-0 transition-transform duration-500">
                                <Image
                                    src={heroImage}
                                    alt="Risol Lumer Matcha"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>

                            {/* Floating elements */}
                            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-3xl shadow-xl animate-bounce">
                                <span className="text-4xl">🍵</span>
                            </div>
                            <div className="absolute -bottom-4 -left-4 bg-white p-3 rounded-2xl shadow-lg animate-bounce delay-300">
                                <span className="text-3xl">🍫</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== PRODUCTS ===== */}
            <section id="produk" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="text-center mb-10">
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-800 mb-3">
                        Menu Kami ✨
                    </h2>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Pilih favoritmu! Semua varian sama enaknya, tapi tetap punya ciri khas masing-masing 😋
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {PRODUCTS.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </section>

            {/* ===== HOW TO ORDER ===== */}
            <section className="bg-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-black text-gray-800 mb-10">Cara Order 📋</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            { step: "1", icon: "🛒", title: "Pilih Produk", desc: "Pilih varian dan jumlah yang kamu inginkan" },
                            { step: "2", icon: "📝", title: "Isi Form", desc: "Isi nama, nomor WA, dan pilih ambil sendiri atau diantar" },
                            { step: "3", icon: "💬", title: "Konfirmasi WA", desc: "Konfirmasi order ke admin via WhatsApp dan tunggu konfirmasi balik" },
                        ].map((s) => (
                            <div key={s.step} className="flex flex-col items-center gap-3">
                                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl">
                                    {s.step}
                                </div>
                                <div className="text-4xl">{s.icon}</div>
                                <h3 className="font-black text-gray-800">{s.title}</h3>
                                <p className="text-gray-600 text-sm">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                    <Link href="/order" className="btn-primary mt-10 inline-block">
                        Mulai Order Sekarang →
                    </Link>
                </div>
            </section>

            {/* ===== AFILIASI PROMO ===== */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
                <div className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl p-8 text-white text-center">
                    <h2 className="text-3xl font-black mb-3">💰 Program Afiliasi</h2>
                    <p className="text-white/80 mb-6 max-w-md mx-auto">
                        Beli risol isi 3 dan dapat kode afiliasi! Ajak 5 teman pakai kodemu dan
                        dapatkan <strong>3 risol gratis pilihan kamu</strong> 🎉
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/order" className="bg-white text-primary font-black py-3 px-8 rounded-2xl hover:bg-cream transition-colors">
                            Beli Sekarang
                        </Link>
                        <Link href="/afiliasi" className="border-2 border-white text-white font-black py-3 px-8 rounded-2xl hover:bg-white/10 transition-colors">
                            Cek Progress
                        </Link>
                    </div>
                </div>
            </section>

            <footer className="bg-gray-800 text-white pt-16 pb-8 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                        {/* Brand */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-3xl">🫓</span>
                                <span className="text-2xl font-black">Risol Lumer</span>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                &ldquo;Lumer di mulut, awet di hati 🫓&rdquo; — Kami menyajikan risol premium handmade dengan bahan pilihan untuk kebahagiaan setiap gigitan.
                            </p>
                        </div>

                        {/* Navigation */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 border-b border-white/10 pb-2">Navigasi</h4>
                            <ul className="space-y-3 text-gray-400 text-sm">
                                <li><Link href="/" className="hover:text-primary transition-colors">Beranda</Link></li>
                                <li><Link href="/order" className="hover:text-primary transition-colors">Pesan Sekarang</Link></li>
                                <li><Link href="/afiliasi" className="hover:text-primary transition-colors">Program Afiliasi</Link></li>
                            </ul>
                        </div>

                        {/* Dashboards */}
                        <div>
                            <h4 className="font-bold text-lg mb-6 border-b border-white/10 pb-2">Area Partner</h4>
                            <ul className="space-y-3 text-gray-400 text-sm">
                                <li>
                                    <Link href="/afiliasi/login" className="flex items-center gap-2 hover:text-yellow-400 transition-colors">
                                        <span>🎁</span> Dashboard Afiliasi
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/risol-admin-2024/login" className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                                        <span>🔐</span> Dashboard Admin
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-8 text-center">
                        <p className="text-gray-500 text-xs mt-4">© {new Date().getFullYear()} Risol Lumer. All rights reserved. • Dibuat dengan ❤️ untuk pecinta risol.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
