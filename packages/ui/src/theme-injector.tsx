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
      --deep: ${deepNavy};
      --accent: ${accentGold};
      --accent-light: ${accentLight};
      --surface: ${surface};
      --bg: ${ivoryBg};
      --card: ${surface};
      --text: ${textInk};
      --muted: #576277;
      --line: #E4E0D6;
    }

    [data-theme="dark"], :root[data-theme="dark"] {
      --brand-surface: #102A52;
      --brand-bg: #0A1D3B;
      --brand-text: #EEF3FA;
      --brand-deep: #06142B;
      --brand-primary: ${accentLight};
      --brand-accent: ${accentLight};
      --surface: #0F1F3B;
      --bg: #0A1730;
      --card: #12264A;
      --text: #E6ECF6;
      --muted: #9FB0C9;
      --line: #243C66;
    }
  `;

  return (
    <style
      id="aegis-theme-tokens"
      dangerouslySetInnerHTML={{ __html: css }}
    />
  );
}
