import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlanProvider } from "@/hooks/usePlan";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { UILanguageProvider } from "@/hooks/useUILanguage";
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
import BillingPage from "@/pages/BillingPage";
import SettingsLayout from "@/components/SettingsLayout";
import SettingsOverviewPage from "@/pages/settings/SettingsOverviewPage";
import OrganizationSettingsPage from "@/pages/settings/OrganizationSettingsPage";
import BrandSettingsPage from "@/pages/settings/BrandSettingsPage";
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
import AdminSettingsPage from "@/pages/admin/AdminSettingsPage";
import AdminFormSubmissionsPage from "@/pages/admin/AdminFormSubmissionsPage";

// SEO landing pages
import EventAgendaSoftwarePage from "@/pages/seo/EventAgendaSoftwarePage";
import AgendaWidgetWebsitePage from "@/pages/seo/AgendaWidgetWebsitePage";
import EventPromotieHorecaPage from "@/pages/seo/EventPromotieHorecaPage";
import SoftwareVoorKleineEvenementenPage from "@/pages/seo/SoftwareVoorKleineEvenementenPage";
import ClickWiseIntegratiePage from "@/pages/seo/ClickWiseIntegratiePage";
import DemoPage from "@/pages/seo/DemoPage";
import DiscoverEventsPage from "@/pages/DiscoverEventsPage";

const queryClient = new QueryClient({});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <UILanguageProvider>
        <TenantProvider>
        <PlanProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/evenementen" element={<DiscoverEventsPage />} />
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
              <Route path="/e/:slug/index.html" element={<PublicEventPage />} />
              <Route path="/s/*" element={<PublicEventPage />} />
              <Route path="/unsubscribe" element={<UnsubscribePage />} />

              {/* App routes */}
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="events" element={<EventsPage />} />
                <Route path="events/new" element={<CreateEventPage />} />
                <Route path="events/templates" element={<TemplatesPage />} />
                <Route path="events/:id" element={<CreateEventPage />} />
                <Route path="templates" element={<Navigate to="/app/events/templates" replace />} />
                <Route path="distribution" element={<DistributionPage />} />
                <Route path="widgets" element={<Navigate to="/app/settings/website/widgets" replace />} />
                <Route path="categories" element={<Navigate to="/app/settings/inhoud/categorieen" replace />} />
                <Route path="media" element={<Navigate to="/app/settings/inhoud/media" replace />} />
                <Route path="team" element={<Navigate to="/app/settings/team" replace />} />
                <Route path="integrations" element={<Navigate to="/app/settings/website/koppelingen" replace />} />
                <Route path="billing" element={<Navigate to="/app/settings/abonnement" replace />} />
                <Route path="settings" element={<SettingsLayout />}>
                  <Route index element={<SettingsOverviewPage />} />
                  <Route path="organisatie" element={<OrganizationSettingsPage />} />
                  <Route path="merk" element={<BrandSettingsPage />} />
                  <Route path="inhoud" element={<Navigate to="/app/settings/inhoud/categorieen" replace />} />
                  <Route path="inhoud/categorieen" element={<CategoriesPage />} />
                  <Route path="inhoud/media" element={<MediaPage />} />
                  <Route path="team" element={<TeamPage />} />
                  <Route path="koppelingen" element={<Navigate to="/app/settings/website/koppelingen" replace />} />
                  <Route path="website" element={<Navigate to="/app/settings/website/widgets" replace />} />
                  <Route path="website/widgets" element={<WidgetsPage />} />
                  <Route path="website/koppelingen" element={<IntegrationsPage />} />
                  <Route path="abonnement" element={<BillingPage />} />
                </Route>
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="tenants" element={<AdminTenantsPage />} />
                <Route path="tenants/:id" element={<AdminTenantDetailPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="subscriptions" element={<AdminSubscriptionsPage />} />
                <Route path="plans" element={<AdminPlansPage />} />
                <Route path="overrides" element={<AdminOverridesPage />} />
                <Route path="audit" element={<AdminAuditPage />} />
                <Route path="form-submissions" element={<AdminFormSubmissionsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </PlanProvider>
        </TenantProvider>
        </UILanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
