export type PlanId = "free" | "basic" | "pro";

export interface PlanLimits {
  maxActiveEvents: number;
  maxWidgets: number;
  maxTeamMembers: number;
  customCategories: boolean;
  customBranding: boolean;
  advancedBranding: boolean;
  multipleLocations: boolean;
  clickwiseIntegration: boolean;
  advancedDistribution: boolean;
  advancedAnalytics: boolean;
  ticketingReady: boolean;
  agendaWidget: boolean;
  singleEventWidget: boolean;
  allTemplates: boolean;
  distributionCenter: boolean;
  freeBoostsPerMonth: number;
}

export const planLimits: Record<PlanId, PlanLimits> = {
  free: {
    maxActiveEvents: 3,
    maxWidgets: 1,
    maxTeamMembers: 1,
    customCategories: false,
    customBranding: false,
    advancedBranding: false,
    multipleLocations: false,
    clickwiseIntegration: false,
    advancedDistribution: false,
    advancedAnalytics: false,
    ticketingReady: false,
    agendaWidget: false,
    singleEventWidget: false,
    allTemplates: false,
    distributionCenter: false,
  },
  basic: {
    maxActiveEvents: 15,
    maxWidgets: 3,
    maxTeamMembers: 3,
    customCategories: true,
    customBranding: true,
    advancedBranding: false,
    multipleLocations: false,
    clickwiseIntegration: false,
    advancedDistribution: false,
    advancedAnalytics: false,
    ticketingReady: false,
    agendaWidget: true,
    singleEventWidget: true,
    allTemplates: true,
    distributionCenter: true,
  },
  pro: {
    maxActiveEvents: Infinity,
    maxWidgets: Infinity,
    maxTeamMembers: 10,
    customCategories: true,
    customBranding: true,
    advancedBranding: true,
    multipleLocations: true,
    clickwiseIntegration: true,
    advancedDistribution: true,
    advancedAnalytics: true,
    ticketingReady: true,
    agendaWidget: true,
    singleEventWidget: true,
    allTemplates: true,
    distributionCenter: true,
  },
};

// Future ticketing module types (architecture only)
export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  price: number;
  currency: "EUR";
  isFree: boolean;
  maxQuantity: number;
  soldCount: number;
  // Future: QR/barcode, anti-fraud, payment provider
}
