import type { PlanId } from "./plans";

export type EventStatus = "draft" | "published" | "scheduled" | "archived" | "ended";
export type EventCategory = "sport" | "proeverij" | "live-muziek" | "thema-avond" | "overig";
export type UserRole = "owner" | "admin" | "editor" | "marketer" | "viewer";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  planId: PlanId;
  logoUrl?: string;
  primaryColor?: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface EventData {
  id: string;
  tenantId: string;
  title: string;
  subtitle?: string;
  shortDescription?: string;
  fullDescription?: string;
  category: EventCategory;
  customCategory?: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  venue?: string;
  address?: string;
  organizer?: string;
  featuredImage?: string;
  gallery?: string[];
  sponsorNames?: string[];
  sponsorLogos?: string[];
  ctaButtonText?: string;
  ctaLink?: string;
  tags?: string[];
  socialShareText?: string;
  whatsappShareText?: string;
  seoTitle?: string;
  seoDescription?: string;
  slug: string;
  status: EventStatus;
  isRecurring?: boolean;
  recurringPattern?: string;
  publishAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  tenantId?: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
}

export interface TeamMember {
  id: string;
  tenantId: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  invitedAt: string;
  acceptedAt?: string;
}

export interface Widget {
  id: string;
  tenantId: string;
  type: "agenda" | "single-event";
  name: string;
  config: Record<string, unknown>;
  createdAt: string;
}
