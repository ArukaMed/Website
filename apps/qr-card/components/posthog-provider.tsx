"use client";

import React, { useEffect } from "react";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY || process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

    if (key && typeof window !== "undefined") {
      import("posthog-js")
        .then(({ default: posthog }) => {
          posthog.init(key, {
            api_host: host,
            person_profiles: "identified_only",
            capture_pageview: true,
          });
        })
        .catch(() => {});
    }
  }, []);

  return <>{children}</>;
}
