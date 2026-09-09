import { auth } from "@/lib/auth/auth";
import { toNextJsHandler } from "better-auth/next-js";

const handlers = toNextJsHandler(auth.handler);

export const { GET, POST, PATCH, PUT, DELETE } = handlers;
