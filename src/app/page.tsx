"use client"

import App from "@/components/App";
import { SessionProvider } from "next-auth/react";

export default function Home() {
  return (
    <SessionProvider>
      <App />
    </SessionProvider>
  );
}
