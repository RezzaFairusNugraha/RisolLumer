// Simple session-based auth using sessionStorage
// Admin credentials (change these as needed)
export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "rezza";

const ADMIN_SESSION_KEY = "risol_admin_session";
const AFIL_SESSION_KEY = "risol_afil_session";

// ===== ADMIN AUTH =====
export function adminLogin(username: string, password: string): boolean {
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        return true;
    }
    return false;
}

export function isAdminLoggedIn(): boolean {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
}

export function adminLogout(): void {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

// ===== AFFILIATE AUTH =====
// Stores the affiliate code of the logged-in affiliate
export function afilLogin(code: string): void {
    sessionStorage.setItem(AFIL_SESSION_KEY, code);
}

export function getAfilSession(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(AFIL_SESSION_KEY);
}

export function afilLogout(): void {
    sessionStorage.removeItem(AFIL_SESSION_KEY);
}
