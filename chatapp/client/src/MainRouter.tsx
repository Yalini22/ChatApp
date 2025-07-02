import { useState } from "react";
import { Switch, Route } from "wouter";
import { useQuery } from "@tanstack/react-query";
import Chat from "@/pages/chat";
import NotFound from "@/pages/not-found";
import type { User } from "@shared/schema";

export default function MainRouter() {
  const [mode, setMode] = useState<"login" | "register" | "chat">("login");

  const { data: currentUser } = useQuery<User | null>({
    queryKey: ["/api/user/current"],
    queryFn: async () => {
      const res = await fetch("/api/user/current");
      if (!res.ok) return null;
      return res.json();
    },
  })

  return (
    <Switch>
      <Route path="/" component={Chat} />
      <Route component={NotFound} />
    </Switch>
  );
}
