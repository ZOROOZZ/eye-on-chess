import { prisma } from "./prisma.js";

export interface SiteSettingsData {
  siteName: string;
  registrationOpen: boolean;
  maxUsers: number;
  requireEmailVerification: boolean;
}

export async function getSiteSettings(): Promise<SiteSettingsData> {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "singleton" },
  });

  if (settings) {
    return {
      siteName: settings.siteName,
      registrationOpen: settings.registrationOpen,
      maxUsers: settings.maxUsers,
      requireEmailVerification: settings.requireEmailVerification,
    };
  }

  // Fallback to env vars
  return {
    siteName: process.env.SITE_NAME || "EyeOnChess",
    registrationOpen: process.env.REGISTRATION_OPEN !== "false",
    maxUsers: parseInt(process.env.MAX_USERS || "0"),
    requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === "true",
  };
}
