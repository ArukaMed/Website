import React from "react";
import type { TenantThemeConfig } from "@aegis/types";

interface ThemeInjectorProps {
  theme: TenantThemeConfig;
  mode?: "light" | "dark" | "auto";
}

/**
 * Server Component: Injects runtime CSS variables into <head> with zero client-side JavaScript.
 */
export function ThemeInjector({ theme, mode = "light" }: ThemeInjectorProps) {
  const {
    primary,
    primaryHover,
    deepNavy,
    accentGold,
    accentLight,
    surface,
    ivoryBg,
    textInk,
    borderRadius,
    buttonStyle,
    fontDisplay,
    fontBody,
  } = theme;

  const btnRadius =
    buttonStyle === "pill"
      ? "9999px"
      : buttonStyle === "square"
      ? "2px"
      : `${borderRadius}px`;

  const displayFont =
    fontDisplay === "serif"
      ? "'Source Serif 4', Georgia, 'Times New Roman', serif"
      : fontBody || "'Public Sans', system-ui, -apple-system, sans-serif";

  const css = `
    :root {
      --brand-primary: ${primary};
      --brand-primary-hover: ${primaryHover};
      --brand-deep: ${deepNavy};
      --brand-accent: ${accentGold};
      --brand-accent-light: ${accentLight};
      --brand-surface: ${surface};
      --brand-bg: ${ivoryBg};
      --brand-text: ${textInk};
      --brand-radius: ${borderRadius}px;
      --brand-btn-radius: ${btnRadius};
      --font-display: ${displayFont};
      --font-body: ${fontBody};
      --primary: ${primary};
      --primary-hover: ${primaryHover};
      --navy: #1B3F73;
      --navy-mid: #12305C;
      --navy-deep: #0C2244;
      --navy-tint: #EAF0F8;
      --gold: #C8963E;
      --gold-deep: #8A5A1F;
      --gold-tint: #F6EEDD;
      --ivory: #FBFAF7;
      --surface: #FFFFFF;
      --ink: #101C2E;
      --heading: #1B3F73;
      --muted: #576277;
      --line: #E4E0D6;
      --page: #E6EBF2;
      --on-primary: #FFFFFF;
      --btn-icon: #C8963E;
      --wa: #1E9E50;
      --err: #B3261E;
      --ok: #1E7A46;
      --hdr-a: #12305C;
      --hdr-b: #0C2244;
      --glow: rgba(200, 150, 62, 0.18);
    }

    [data-theme="dark"], :root[data-theme="dark"], html[data-theme="dark"] {
      --brand-surface: #112A52;
      --brand-bg: #0A1D3B;
      --brand-text: #EEF3FA;
      --brand-deep: #06142B;
      --brand-primary: #DAA950;
      --brand-accent: #DAA950;
      --navy: #5C8AD0;
      --navy-mid: #17396B;
      --navy-deep: #06142B;
      --navy-tint: #243B60;
      --gold: #DAA950;
      --gold-deep: #8A5A1F;
      --gold-tint: #2A2A2A;
      --ivory: #0A1D3B;
      --surface: #112A52;
      --ink: #EEF3FA;
      --heading: #F4F6FC;
      --muted: #A5B3CA;
      --line: #2D4264;
      --page: #050F20;
      --primary: #DAA950;
      --primary-hover: #8A5A1F;
      --on-primary: #0A1D3B;
      --btn-icon: #0A1D3B;
      --wa: #38D280;
      --err: #FF9C94;
      --ok: #7FE0A8;
      --hdr-a: #123063;
      --hdr-b: #0A1D3B;
      --glow: rgba(217, 169, 80, 0.20);
    }
  `;

  return (
    <style
      id="aegis-theme-tokens"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
