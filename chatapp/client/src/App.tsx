import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import MainRouter from "./MainRouter"; // 👈 moved routing logic here

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <MainRouter /> {/* ✅ this now runs inside QueryClientProvider */}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

