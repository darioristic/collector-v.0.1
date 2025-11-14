import type { userStatus } from "../../db/schema/settings.schema.js";

export type UserStatus = (typeof userStatus.enumValues)[number];

export type RegisterInput = {
  companyName: string;
  companyDomain?: string | null;
  fullName: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  token: string;
  password: string;
};

export type RequestMetadata = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type AuthCompany = {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  role: string | null;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  defaultCompanyId: string | null;
  company: AuthCompany | null;
};

export type AuthSession = {
  token: string;
  expiresAt: string;
};

export type AuthPayload = {
  user: AuthUser;
  session: AuthSession;
};

export type ForgotPasswordPayload = {
  token: string | null;
  expiresAt: string | null;
};


