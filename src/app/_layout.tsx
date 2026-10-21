import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, type ReactNode } from "react";

import { useSession, SessionProvider } from "@/session/SessionProvider";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function SplashGate({ children }: { children: ReactNode }) {
  const { ready } = useSession();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;
  return children;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SplashGate>
          <Stack screenOptions={{ headerShown: false }} />
        </SplashGate>
      </SessionProvider>
    </QueryClientProvider>
  );
}
