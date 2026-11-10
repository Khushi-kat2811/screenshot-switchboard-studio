import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getGoogleClientId } from "@/lib/auth";

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select: boolean;
          }) => void;
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean;
            isSkippedMoment: () => boolean;
          }) => void) => void;
        };
      };
    };
  }
}

const GOOGLE_SCRIPT_ID = "booking-holdings-google-identity";
let googleSdkPromise: Promise<void> | undefined;

function loadGoogleIdentitySdk() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleSdkPromise) return googleSdkPromise;

  googleSdkPromise = new Promise<void>((resolve, reject) => {
    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = GOOGLE_SCRIPT_ID;
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => {
      if (window.google?.accounts?.id) resolve();
      else reject(new Error("Google sign-in could not be initialized. Please try again."));
    };
    const handleError = () => reject(new Error("Google sign-in is unavailable. Please try again later."));
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  }).catch((error: unknown) => {
    googleSdkPromise = undefined;
    throw error;
  });

  return googleSdkPromise;
}

export function AuthBrand() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <ShieldCheck aria-hidden="true" className="size-6" strokeWidth={2} />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-foreground">Booking Holdings</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Enterprise Workspace</p>
      </div>
    </div>
  );
}

export function GoogleAuthenticationButton({
  text,
  busy,
  onCredential,
  onError,
}: {
  text: "Continue with Google" | "Sign Up with Google";
  busy: boolean;
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
}) {
  const clientId = getGoogleClientId();
  const callbackRef = useRef(onCredential);
  const errorRef = useRef(onError);
  const [ready, setReady] = useState(false);

  callbackRef.current = onCredential;
  errorRef.current = onError;

  useEffect(() => {
    if (!clientId) return;
    let active = true;

    void loadGoogleIdentitySdk()
      .then(() => {
        const identity = window.google?.accounts?.id;
        if (!active || !identity) return;

        identity.initialize({
          client_id: clientId,
          auto_select: false,
          callback: (response) => {
            if (!active) return;
            if (!response.credential) {
              errorRef.current("Google did not return a sign-in token. Please try again.");
              return;
            }
            callbackRef.current(response.credential);
          },
        });
        setReady(true);
      })
      .catch((error: unknown) => {
        if (active) {
          errorRef.current(error instanceof Error ? error.message : "Google sign-in could not be initialized.");
        }
      });

    return () => {
      active = false;
    };
  }, [clientId]);

  function startGoogleSignIn() {
    const identity = window.google?.accounts?.id;
    if (!identity) {
      onError("Google sign-in is still loading. Please try again in a moment.");
      return;
    }
    onError("");
    identity.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        onError("Google sign-in was unavailable. Allow Google sign-in for this site and try again.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        disabled={!clientId || !ready || busy}
        className="h-11 w-full justify-center border-input bg-card text-sm font-medium text-foreground shadow-sm hover:bg-muted/60"
        onClick={startGoogleSignIn}
      >
        {busy ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <GoogleMark />
        )}
        {text}
      </Button>
      {!clientId && (
        <p className="text-center text-xs text-muted-foreground">
          Google sign-in requires a Google client ID in your frontend settings.
        </p>
      )}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-[18px] shrink-0" viewBox="0 0 48 48">
      <path className="fill-google-blue" d="M43.61 24.5c0-1.39-.12-2.72-.35-4H24v7.56h11a9.4 9.4 0 0 1-4.09 6.16v5.03h6.62c3.87-3.57 6.08-8.83 6.08-14.75Z" />
      <path className="fill-google-green" d="M24 44c5.4 0 9.93-1.79 13.24-4.85l-6.62-5.03c-1.83 1.23-4.17 1.96-6.62 1.96-5.08 0-9.38-3.43-10.92-8.04H6.24v5.19A19.98 19.98 0 0 0 24 44Z" />
      <path className="fill-google-yellow" d="M13.08 28.04a12 12 0 0 1 0-7.58v-5.19H6.24a20 20 0 0 0 0 17.96l6.84-5.19Z" />
      <path className="fill-google-red" d="M24 12.42c2.94 0 5.58 1.01 7.66 3l5.74-5.74C33.92 6.46 29.4 4 24 4A19.98 19.98 0 0 0 6.24 15.27l6.84 5.19C14.62 15.85 18.92 12.42 24 12.42Z" />
    </svg>
  );
}

export function AuthPageShell({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "login" | "signup";
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-5 py-10 sm:px-6">
      <div className="w-full max-w-[430px]">
        <div className="mb-7">
          <AuthBrand />
        </div>
        <section aria-label={mode === "login" ? "Log in" : "Create an account"} className="rounded-lg border border-border bg-card px-6 py-7 shadow-lg sm:px-8 sm:py-8">
          {children}
        </section>
        <div className="mt-6 text-center">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <a href="/" className="inline-flex items-center gap-2">
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              Back to workspace
            </a>
          </Button>
        </div>
      </div>
    </main>
  );
}

export function AuthDivider() {
  return (
    <div className="my-5 flex items-center gap-3" aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">OR</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}