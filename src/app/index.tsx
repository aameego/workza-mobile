import { Redirect } from "expo-router";

import { useSession } from "@/session/SessionProvider";

export default function Index() {
  const { session } = useSession();
  if (session) return <Redirect href="/home" />;
  return <Redirect href="/login" />;
}
