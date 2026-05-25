import NextAuth from "next-auth";
import { cache } from "react";

import { applyCanonicalAuthEnv } from "./baseUrl";
import { authConfig } from "./config";

applyCanonicalAuthEnv();

const { auth: uncachedAuth, handlers, signIn, signOut } = NextAuth(authConfig);

const auth = cache(uncachedAuth);

export { auth, handlers, signIn, signOut };
