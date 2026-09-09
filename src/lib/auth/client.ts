/**
 * Better Auth Client Configuration
 * 
 * Mounts Better Auth React client with baseURL, basePath, and dashClient plugin.
 */

import { createAuthClient } from "better-auth/react";
import { dashClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : (process.env.BETTER_AUTH_URL || "http://localhost:3000"),
  basePath: "/api/auth",
  plugins: [
    dashClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
