import { z } from "zod";

// ── Common ─────────────────────────────────────────────

export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const paginationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

// ── Auth ───────────────────────────────────────────────

export const registerBodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
  inviteCode: z.string().min(1),
});

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const preferencesBodySchema = z.object({
  darkMode: z.boolean().optional(),
  boardTheme: z.string().optional(),
  pieceSet: z.string().optional(),
  soundEnabled: z.boolean().optional(),
});

// ── Users ──────────────────────────────────────────────

export const userSearchQuerySchema = z.object({
  q: z.string().min(1).optional(),
});

export const usernameParamSchema = z.object({
  username: z.string().min(1),
});

export const userProfileQuerySchema = z.object({
  vsUserId: z.string().optional(),
});

// ── Games ──────────────────────────────────────────────

export const createFriendGameBodySchema = z.object({
  friendId: z.string().min(1),
  preset: z.string().optional(),
  initialTime: z.number().optional(),
  increment: z.number().optional(),
});

export const gameActionBodySchema = z.object({
  gameId: z.string().min(1),
});

export const createBotGameBodySchema = z.object({
  botElo: z.number().int().min(200).max(3200),
  color: z.enum(["white", "black", "random"]),
  preset: z.string().optional(),
  initialTime: z.number().optional(),
  increment: z.number().optional(),
});

export const makeMoveBodySchema = z.object({
  from: z.string().min(2).max(2),
  to: z.string().min(2).max(2),
  promotion: z.string().max(1).optional(),
});

export const syncOfflineGameBodySchema = z.object({
  botElo: z.number().int().min(200).max(3200),
  playerIsWhite: z.boolean(),
  moves: z
    .array(
      z.object({
        ply: z.number().int(),
        san: z.string(),
        uci: z.string(),
        fen: z.string(),
      })
    )
    .min(1, "No moves to sync"),
  result: z.string().nullable(),
  termination: z.string().nullable(),
  startedAt: z.string(),
  endedAt: z.string().nullable(),
});

// ── Friends ────────────────────────────────────────────

export const sendFriendRequestBodySchema = z.object({
  username: z.string().min(1),
});

export const friendActionBodySchema = z.object({
  friendshipId: z.string().min(1),
});

export const friendshipIdParamSchema = z.object({
  friendshipId: z.string().min(1),
});

// ── Admin ──────────────────────────────────────────────

export const adminUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.string().optional(),
});

export const adminUpdateUserBodySchema = z.object({
  active: z.boolean().optional(),
  verified: z.boolean().optional(),
  role: z.string().optional(),
});

export const adminCreateUserBodySchema = z.object({
  email: z.string().email(),
  username: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.string().optional(),
  verified: z.boolean().optional(),
});

export const adminGamesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
});

export const adminUpdateSettingsBodySchema = z.object({
  siteName: z.string().optional(),
  registrationOpen: z.boolean().optional(),
  maxUsers: z.number().optional(),
  requireEmailVerification: z.boolean().optional(),
});

export const adminAuditLogQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  action: z.string().optional(),
  adminId: z.string().optional(),
});

// ── Collections ────────────────────────────────────────

export const createCollectionBodySchema = z.object({
  name: z.string().min(1).max(50),
});

export const addGameToCollectionBodySchema = z.object({
  gameId: z.string().min(1),
});

export const collectionGameParamsSchema = z.object({
  id: z.string().min(1),
  gameId: z.string().min(1),
});

// ── Notes ──────────────────────────────────────────────

export const updateNoteBodySchema = z.object({
  text: z.string().max(2000).optional(),
});

// ── Invites ────────────────────────────────────────────

export const validateInviteParamSchema = z.object({
  code: z.string().min(1),
});
