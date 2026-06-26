import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth's catch-all handler — serves /api/auth/* (sign-in, sign-up,
// callback, OTP, session, etc). Additive alongside Clerk's own routes.
export const { GET, POST } = toNextJsHandler(auth);
