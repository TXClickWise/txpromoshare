import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlanProvider } from "@/hooks/usePlan";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import PublicLayout from "@/components/PublicLayout";
import AppLayout from "@/components/AppLayout";
import AdminLayout from "@/components/AdminLayout";
import LandingPage from "@/pages/LandingPage";
import PricingPage from "@/pages/PricingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
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
import UnsubscribePage from "@/pages/UnsubscribePage";

// Admin pages
import AdminDashboardPage from "@/pages/admin/AdminDashboardPage";
import AdminTenantsPage from "@/pages/admin/AdminTenantsPage";
import AdminTenantDetailPage from "@/pages/admin/AdminTenantDetailPage";
import AdminUsersPage from "@/pages/admin/AdminUsersPage";
import AdminSubscriptionsPage from "@/pages/admin/AdminSubscriptionsPage";
import AdminPlansPage from "@/pages/admin/AdminPlansPage";
import AdminOverridesPage from "@/pages/admin/AdminOverridesPage";
import AdminAuditPage from "@/pages/admin/AdminAuditPage";

// SEO landing pages
import EventAgendaSoftwarePage from "@/pages/seo/EventAgendaSoftwarePage";
import AgendaWidgetWebsitePage from "@/pages/seo/AgendaWidgetWebsitePage";
import EventPromotieHorecaPage from "@/pages/seo/EventPromotieHorecaPage";
import SoftwareVoorKleineEvenementenPage from "@/pages/seo/SoftwareVoorKleineEvenementenPage";
import ClickWiseIntegratiePage from "@/pages/seo/ClickWiseIntegratiePage";
import DemoPage from "@/pages/seo/DemoPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <TenantProvider>
        <PlanProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/demo" element={<DemoPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* SEO landing pages */}
                <Route path="/event-agenda-software" element={<EventAgendaSoftwarePage />} />
                <Route path="/agenda-widget-website" element={<AgendaWidgetWebsitePage />} />
                <Route path="/event-promotie-horeca" element={<EventPromotieHorecaPage />} />
                <Route path="/software-voor-kleine-evenementen" element={<SoftwareVoorKleineEvenementenPage />} />
                <Route path="/clickwise-integratie" element={<ClickWiseIntegratiePage />} />
              </Route>

              {/* Public event pages */}
              <Route path="/e/:slug" element={<PublicEventPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />

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

              {/* Admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="tenants" element={<AdminTenantsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PlanProvider>
        </TenantProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
