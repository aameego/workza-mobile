import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, type ReactNode } from "react";

import { SessionProvider, useSession } from "@/session/SessionProvider";
import { colors, useWorkzaFonts } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function SplashGate({ children }: { children: ReactNode }) {
  const fontsReady = useWorkzaFonts();
  const { ready } = useSession();
  const go = fontsReady && ready;

  useEffect(() => {
    if (go) SplashScreen.hideAsync().catch(() => {});
  }, [go]);

  if (!go) return null;
  return children;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <SplashGate>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
        </SplashGate>
      </SessionProvider>
    </QueryClientProvider>
  );
}
