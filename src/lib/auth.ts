import axios from "axios";
import { z } from "zod";

const emailSchema = z.string().trim().email("Enter a valid email address.").max(255);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const signupSchema = z
  .object({
    full_name: z.string().trim().min(1, "Enter your full name.").max(255),
    email: emailSchema,
    password: z.string().min(8, "Use at least 8 characters for your password.").max(128),
    confirm_password: z.string().min(1, "Confirm your password."),
    agree_to_terms: z.boolean().refine((accepted) => accepted, "Accept the terms to continue."),
  })
  .refine((values) => values.password === values.confirm_password, {
    message: "Passwords do not match.",
    path: ["confirm_password"],
  });

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;

export interface AuthenticatedUser {
  id?: string | number;
  full_name?: string;
  name?: string;
  email?: string;
}

const authResponseSchema = z.object({
  access_token: z.string().min(1, "The authentication service did not return a token."),
  user: z
    .object({
      id: z.union([z.string(), z.number()]).optional(),
      full_name: z.string().optional(),
      name: z.string().optional(),
      email: z.string().email().optional(),
    })
    .passthrough()
    .optional(),
});

const userSchema = z
  .object({
    id: z.union([z.string(), z.number()]).optional(),
    full_name: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
  })
  .passthrough();

function getApiUrl() {
  const apiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "");
  if (!apiUrl) {
    throw new Error("The sign-in service is not configured yet. Add your FastAPI address as VITE_API_URL.");
  }
  return apiUrl;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("booking-holdings-access-token") ??
    window.sessionStorage.getItem("booking-holdings-access-token");
}

function saveToken(token: string, remember = true) {
  if (typeof window === "undefined") return;
  const storage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;
  otherStorage.removeItem("booking-holdings-access-token");
  storage.setItem("booking-holdings-access-token", token);
}

export function clearAuthentication() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("booking-holdings-access-token");
  window.sessionStorage.removeItem("booking-holdings-access-token");
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail: unknown = error.response?.data?.detail ?? error.response?.data?.message;
    if (typeof detail === "string" && detail.trim()) return detail;
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => (typeof item === "object" && item !== null && "msg" in item ? item.msg : null))
        .filter((message): message is string => typeof message === "string");
      if (messages.length) return messages.join(" ");
    }
    if (!error.response) {
      return "We couldn't reach your sign-in service. Check that it is running and try again.";
    }
  }
  if (error instanceof Error) return error.message;
  return "We couldn't complete that request. Please try again.";
}

async function requestAuthentication(
  endpoint: string,
  payload: Record<string, string>,
  remember = true,
) {
  try {
    const response = await axios.post(`${getApiUrl()}/api/auth/${endpoint}`, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15_000,
    });
    const parsed = authResponseSchema.safeParse(response.data);
    if (!parsed.success) {
      throw new Error("The sign-in service returned an invalid response. Please contact your administrator.");
    }
    saveToken(parsed.data.access_token, remember);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

export async function loginWithPassword(values: LoginValues, remember: boolean) {
  const credentials = loginSchema.parse(values);
  await requestAuthentication("login", credentials, remember);
}

export async function registerAccount(values: SignupValues) {
  const account = signupSchema.parse(values);
  await requestAuthentication("signup", {
    full_name: account.full_name,
    email: account.email,
    password: account.password,
  });
}

export async function loginWithGoogle(idToken: string) {
  if (!idToken.trim()) throw new Error("Google did not return a sign-in token. Please try again.");
  await requestAuthentication("google", { id_token: idToken });
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await axios.get(`${getApiUrl()}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10_000,
    });
    const parsed = userSchema.safeParse(response.data);
    if (!parsed.success) throw new Error("Your profile could not be read from the sign-in service.");
    return parsed.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) clearAuthentication();
    throw new Error(getErrorMessage(error));
  }
}

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
}
