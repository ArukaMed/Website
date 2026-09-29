import { z } from "zod";

export const HexColorRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

export const TenantThemeConfigSchema = z.object({
  primary: z.string().regex(HexColorRegex, "Invalid hex color for primary"),
  primaryHover: z.string().regex(HexColorRegex, "Invalid hex color for primaryHover"),
  deepNavy: z.string().regex(HexColorRegex, "Invalid hex color for deepNavy"),
  accentGold: z.string().regex(HexColorRegex, "Invalid hex color for accentGold"),
  accentLight: z.string().regex(HexColorRegex, "Invalid hex color for accentLight"),
  surface: z.string().regex(HexColorRegex, "Invalid hex color for surface"),
  ivoryBg: z.string().regex(HexColorRegex, "Invalid hex color for ivoryBg"),
  textInk: z.string().regex(HexColorRegex, "Invalid hex color for textInk"),
  borderRadius: z.number().min(0).max(32).default(10),
  buttonStyle: z.enum(["rounded", "pill", "square"]).default("rounded"),
  fontDisplay: z.enum(["serif", "sans"]).default("serif"),
  fontBody: z.string().default("'Public Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"),
});

export type TenantThemeConfig = z.infer<typeof TenantThemeConfigSchema>;
