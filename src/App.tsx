import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlanProvider } from "@/hooks/usePlan";
import PublicLayout from "@/components/PublicLayout";
import AppLayout from "@/components/AppLayout";
import LandingPage from "@/pages/LandingPage";
import PricingPage from "@/pages/PricingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import EventsPage from "@/pages/EventsPage";
import CreateEventPage from "@/pages/CreateEventPage";
import TemplatesPage from "@/pages/TemplatesPage";
import DistributionPage from "@/pages/DistributionPage";
import WidgetsPage from "@/pages/WidgetsPage";
import CategoriesPage from "@/pages/CategoriesPage";
import MediaPage from "@/pages/MediaPage";
import TeamPage from "@/pages/TeamPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SettingsPage from "@/pages/SettingsPage";
import BillingPage from "@/pages/BillingPage";
import PublicEventPage from "@/pages/PublicEventPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Public event pages */}
          <Route path="/e/:slug" element={<PublicEventPage />} />

          {/* App routes */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/new" element={<CreateEventPage />} />
            <Route path="events/:id" element={<CreateEventPage />} />
            <Route path="templates" element={<TemplatesPage />} />
            <Route path="distribution" element={<DistributionPage />} />
            <Route path="widgets" element={<WidgetsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="media" element={<MediaPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route path="integrations" element={<IntegrationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="billing" element={<BillingPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
