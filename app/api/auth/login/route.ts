import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

// ─── Security: Require JWT_SECRET to be set explicitly ───────────────────────
if (!process.env.JWT_SECRET) {
  throw new Error(
    "[Auth] FATAL: JWT_SECRET environment variable is not set. " +
    "Generate one with: node -e \"require('crypto').randomBytes(64).toString('hex')\" and add it to .env.local"
  );
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// ─── Rate Limiting (in-memory, per-IP) ───────────────────────────────────────
// For production, use Redis or a dedicated rate-limit service.
const loginAttempts = new Map<string, { count: number; lockedUntil?: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function getRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfter?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry) return { allowed: true, remaining: MAX_ATTEMPTS };

  // If currently locked out
  if (entry.lockedUntil && now < entry.lockedUntil) {
    const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  // Reset after lockout expires
  if (entry.lockedUntil && now >= entry.lockedUntil) {
    loginAttempts.delete(ip);
    return { allowed: true, remaining: MAX_ATTEMPTS };
  }

  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const entry = loginAttempts.get(ip) ?? { count: 0 };
  entry.count += 1;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  loginAttempts.set(ip, entry);
}

function clearAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// ─── Input Validation ─────────────────────────────────────────────────────────
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // 1. Get real client IP (X-Forwarded-For in production behind proxy)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  // 2. Rate limit check
  const rateLimit = getRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${rateLimit.retryAfter} seconds.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfter),
          "X-RateLimit-Limit": String(MAX_ATTEMPTS),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  try {
    // 3. Parse and validate body
    let body: { email?: string; password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 4. Input format validation
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 1 || password.length > 128) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }

    // 5. Lookup user — SELECT only what we need (no SELECT *)
    const result = await query(
      "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    // 6. Constant-time comparison: always run bcrypt.compare even if user not found
    //    This prevents timing attacks that expose whether an email exists.
    const DUMMY_HASH = "$2b$10$placeholder.hash.to.prevent.timing.attack.leakagexxx";
    const storedHash = result.rows[0]?.password_hash ?? DUMMY_HASH;

    const passwordMatch = await bcrypt.compare(password, storedHash);

    if (result.rows.length === 0 || !passwordMatch) {
      recordFailedAttempt(ip);
      // Generic error — never reveal whether the email exists or not
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 7a. Check if account is active
    const user = result.rows[0];
    if (!user.is_active) {
      // Don't record as a failed attempt — credentials are correct, account is just suspended
      return NextResponse.json(
        { error: "Your account has been disabled. Please contact an administrator." },
        { status: 403 }
      );
    }

    // 7b. Successful auth — clear rate limit and issue JWT
    clearAttempts(ip);

    const token = await new SignJWT({
      sub: String(user.id),   // Standard JWT claim for subject
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")  // 8-hour sessions (reduced from 24h)
      .sign(JWT_SECRET);

    // 8. Set token in httpOnly, Secure, SameSite=Strict cookie
    const response = NextResponse.json({
      success: true,
      user: { name: user.name, role: user.role },
    });

    response.cookies.set({
      name: "auth_token",
      value: token,
      httpOnly: true,                                          // No JS access
      secure: process.env.NODE_ENV === "production",           // HTTPS only in prod
      sameSite: "strict",                                      // Strict CSRF protection
      maxAge: 60 * 60 * 8,                                    // 8 hours
      path: "/",
    });

    return response;
  } catch (error) {
    // Do NOT expose internal error details to the client
    console.error("[Auth] Login error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}
