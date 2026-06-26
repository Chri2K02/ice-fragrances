"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

// Browser client for Better Auth. Single-tenant subset — only the emailOTP
// plugin (no admin/organization clients). Nothing imports this yet; it's the
// foundation A2/A3 will build the sign-in/up UI on.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || undefined,
  plugins: [emailOTPClient()],
});
