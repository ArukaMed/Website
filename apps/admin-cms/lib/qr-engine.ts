import QRCode from "qrcode";

export type QrVariantType =
  | "simple" // Clean, standard, black-and-white minimalist QR without logos or styling
  | "branded" // Signature corporate QR with custom brand colors and central emblem
  | "cta-frame" // Scan Me / Connect frame with top/bottom callout ribbon
  | "circular-stamp" // Circular badge / sticker with boundary ring for packages, medicine boxes
  | "inverted-metal"; // Dark luxury inverted style

export type QrStylePreset = "aruka-gold" | "corporate-navy" | "monochrome-dark" | "luxury-dark" | "simple-black";
export type QrModuleShape = "square" | "rounded" | "dots";
export type QrEyeShape = "square" | "rounded" | "circle";

export interface QrLogoConfig {
  enabled: boolean;
  src?: string;
  sizeRatio?: number; // 0.18 to 0.24 (default 0.22)
  backgroundColor?: string;
  borderRadius?: number;
}

export interface QrRenderOptions {
  url: string;
  variant?: QrVariantType;
  ctaText?: string; // Top callout e.g. "SCAN TO CONNECT"
  ctaSubtext?: string; // Bottom text e.g. "connect.arukamed.com/abhishikt"
  stampText?: string; // Circular stamp text e.g. "ARUKAMED PHARMACEUTICALS"
  size?: number; // Resolution in px (e.g. 600, 1024, 2400)
  margin?: number; // Margin in modules (default: 2)
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"; // Default: 'H' (30% error correction)
  darkColor?: string; // Module color
  lightColor?: string; // Background color
  eyeOuterColor?: string; // Outer eye finder ring
  eyeInnerColor?: string; // Inner eye center pip
  moduleShape?: QrModuleShape;
  eyeShape?: QrEyeShape;
  logo?: QrLogoConfig;
}

export interface PrintCardSpec {
  dimensionsInches: string;
  dimensionsPoints: string;
  bleedInches: string;
  resolutionDpi: number;
  cmykColorCodes: {
    primaryDeep: string;
    accentGold: string;
    textBlack: string;
    backgroundIvory: string;
  };
}

export function getCommercialPrintSpec(): PrintCardSpec {
  return {
    dimensionsInches: '3.5" x 2.0" (88.9mm x 50.8mm)',
    dimensionsPoints: "252pt x 144pt",
    bleedInches: '0.125" (3.175mm) all sides',
    resolutionDpi: 300,
    cmykColorCodes: {
      primaryDeep: "C: 85%, M: 65%, Y: 15%, K: 65% (Pantone 296 C Deep Navy)",
      accentGold: "C: 15%, M: 35%, Y: 85%, K: 5% (Pantone 7555 C Aruka Gold)",
      textBlack: "C: 0%, M: 0%, Y: 0%, K: 100% (Process Black)",
      backgroundIvory: "C: 2%, M: 2%, Y: 5%, K: 0% (Pantone Warm Gray 1 C)",
    },
  };
}

// Preset color configurations
export const QR_PRESETS: Record<QrStylePreset, {
  name: string;
  description: string;
  variant: QrVariantType;
  darkColor: string;
  lightColor: string;
  eyeOuterColor: string;
  eyeInnerColor: string;
  moduleShape: QrModuleShape;
  eyeShape: QrEyeShape;
  includeLogo: boolean;
}> = {
  "simple-black": {
    name: "Simple Standard QR",
    description: "Classic standard high-compatibility QR code. No logo, sharp square matrix, maximum scannability.",
    variant: "simple",
    darkColor: "#000000",
    lightColor: "#FFFFFF",
    eyeOuterColor: "#000000",
    eyeInnerColor: "#000000",
    moduleShape: "square",
    eyeShape: "square",
    includeLogo: false,
  },
  "aruka-gold": {
    name: "Aruka Executive Gold & Navy",
    description: "Deep Navy modules with signature Aruka Gold finder eyes and central emblem on crisp ivory.",
    variant: "branded",
    darkColor: "#09162D",
    lightColor: "#FFFFFF",
    eyeOuterColor: "#C8963E",
    eyeInnerColor: "#09162D",
    moduleShape: "rounded",
    eyeShape: "rounded",
    includeLogo: true,
  },
  "corporate-navy": {
    name: "Corporate Deep Navy",
    description: "Uniform Aruka Deep Navy (#09162D) on clean white background with subtle rounded curvature.",
    variant: "branded",
    darkColor: "#09162D",
    lightColor: "#FFFFFF",
    eyeOuterColor: "#09162D",
    eyeInnerColor: "#09162D",
    moduleShape: "square",
    eyeShape: "square",
    includeLogo: true,
  },
  "monochrome-dark": {
    name: "Industrial Offset Black",
    description: "Pure #000000 on #FFFFFF for high-contrast commercial thermal and laser printing.",
    variant: "simple",
    darkColor: "#000000",
    lightColor: "#FFFFFF",
    eyeOuterColor: "#000000",
    eyeInnerColor: "#000000",
    moduleShape: "square",
    eyeShape: "square",
    includeLogo: false,
  },
  "luxury-dark": {
    name: "Luxury Inverted Metal Card",
    description: "Warm Gold modules on Midnight Navy backing for metal, NFC, and dark-card finishes.",
    variant: "inverted-metal",
    darkColor: "#E3B15F",
    lightColor: "#09162D",
    eyeOuterColor: "#C8963E",
    eyeInnerColor: "#FFFFFF",
    moduleShape: "rounded",
    eyeShape: "rounded",
    includeLogo: true,
  },
};

/**
 * Checks whether a module at (r, c) falls inside one of the three 7x7 finder patterns.
 */
export function isFinderPattern(r: number, c: number, size: number): boolean {
  if (r <= 6 && c <= 6) return true;
  if (r <= 6 && c >= size - 7) return true;
  if (r >= size - 7 && c <= 6) return true;
  return false;
}

/**
 * Checks whether a module at (r, c) falls in the central logo cutout zone.
 */
export function isLogoArea(r: number, c: number, size: number, logoRatio: number): boolean {
  const center = size / 2;
  const halfLogoModules = (size * logoRatio) / 2;
  return (
    r >= center - halfLogoModules &&
    r <= center + halfLogoModules &&
    c >= center - halfLogoModules &&
    c <= center + halfLogoModules
  );
}

/**
 * Renders a high-resolution, custom-styled QR code directly to an HTML5 canvas.
 * Supports: 'simple', 'branded', 'cta-frame', 'circular-stamp', and 'inverted-metal'.
 */
export function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  options: QrRenderOptions,
  logoImg?: HTMLImageElement | null
): void {
  const {
    url,
    variant = "branded",
    ctaText = "SCAN TO CONNECT",
    ctaSubtext = "",
    stampText = "ARUKAMED PHARMACEUTICALS • B2B NETWORK",
    size = 1024,
    margin = 2,
    errorCorrectionLevel = "H",
    darkColor = "#09162D",
    lightColor = "#FFFFFF",
    eyeOuterColor = "#C8963E",
    eyeInnerColor = "#09162D",
    moduleShape = "rounded",
    eyeShape = "rounded",
    logo,
  } = options;

  const isSimple = variant === "simple";
  const isCtaFrame = variant === "cta-frame";
  const isStamp = variant === "circular-stamp";

  const qr = QRCode.create(url, {
    errorCorrectionLevel: isSimple ? (options.errorCorrectionLevel || "M") : errorCorrectionLevel,
  });

  const matrixSize = qr.modules.size;
  const totalCells = matrixSize + margin * 2;

  // Determine canvas dimensions based on variant
  let canvasW = size;
  let canvasH = size;
  let qrX = 0;
  let qrY = 0;
  let qrRenderSize = size;

  if (isCtaFrame) {
    // Elegant Badge Card with top and bottom margins for CTA ribbon & URL
    canvasW = size;
    canvasH = Math.round(size * 1.25);
    qrRenderSize = Math.round(size * 0.78);
    qrX = (canvasW - qrRenderSize) / 2;
    qrY = Math.round(size * 0.22);
  } else if (isStamp) {
    canvasW = size;
    canvasH = size;
    qrRenderSize = Math.round(size * 0.65);
    qrX = (canvasW - qrRenderSize) / 2;
    qrY = (canvasH - qrRenderSize) / 2;
  }

  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const effectiveCellSize = qrRenderSize / totalCells;

  // 1. Draw Canvas Background
  if (isCtaFrame) {
    ctx.fillStyle = lightColor === "#09162D" ? "#09162D" : "#FAF8F5";
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Outer card border
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = Math.max(3, canvasW * 0.005);
    drawRoundedRect(ctx, 16, 16, canvasW - 32, canvasH - 32, 28);
    ctx.stroke();

    // Top CTA Ribbon Banner
    const ribbonH = Math.round(canvasH * 0.12);
    const ribbonW = Math.round(canvasW * 0.82);
    const ribbonX = (canvasW - ribbonW) / 2;
    const ribbonY = Math.round(canvasH * 0.06);

    ctx.fillStyle = darkColor;
    drawRoundedRect(ctx, ribbonX, ribbonY, ribbonW, ribbonH, ribbonH / 2);
    ctx.fill();

    // Ribbon Text
    ctx.fillStyle = lightColor === "#09162D" ? "#09162D" : "#FFFFFF";
    ctx.font = `bold ${Math.round(ribbonH * 0.45)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ctaText.toUpperCase(), canvasW / 2, ribbonY + ribbonH / 2);

    // Inner QR container backing box
    ctx.fillStyle = lightColor;
    ctx.shadowColor = "rgba(0, 0, 0, 0.08)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    drawRoundedRect(ctx, qrX - 8, qrY - 8, qrRenderSize + 16, qrRenderSize + 16, 20);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Bottom Subtext (URL or Rep info)
    const bottomY = qrY + qrRenderSize + Math.round(canvasH * 0.07);
    ctx.fillStyle = darkColor;
    ctx.font = `600 ${Math.round(canvasW * 0.034)}px system-ui, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const sub = ctaSubtext || url.replace(/^https?:\/\//, "");
    ctx.fillText(sub, canvasW / 2, bottomY);
  } else if (isStamp) {
    // Circular Packaging Stamp
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasW, canvasH);

    const radius = canvasW / 2 - 16;
    const centerX = canvasW / 2;
    const centerY = canvasH / 2;

    // Outer circle
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = Math.max(4, canvasW * 0.008);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner thin ring
    ctx.lineWidth = Math.max(1.5, canvasW * 0.003);
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 14, 0, Math.PI * 2);
    ctx.stroke();

    // Circular Stamp Header Text
    drawCurvedText(ctx, stampText, centerX, centerY, radius - 28, Math.PI * 1.5, darkColor, Math.round(canvasW * 0.035));

    // QR container box in center
    ctx.fillStyle = lightColor;
    drawRoundedRect(ctx, qrX - 6, qrY - 6, qrRenderSize + 12, qrRenderSize + 12, 16);
    ctx.fill();
  } else {
    // Standard / Simple / Branded full canvas
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }

  // 2. Draw Data Modules
  const logoEnabled = !isSimple && logo?.enabled && logoImg && logoImg.complete && logoImg.naturalWidth > 0;
  const logoRatio = logoEnabled ? (logo?.sizeRatio || 0.22) : 0;

  const effectiveModuleShape: QrModuleShape = isSimple ? "square" : moduleShape;
  const effectiveEyeShape: QrEyeShape = isSimple ? "square" : eyeShape;
  const effectiveEyeOuterColor = isSimple ? darkColor : eyeOuterColor;
  const effectiveEyeInnerColor = isSimple ? darkColor : eyeInnerColor;

  ctx.fillStyle = darkColor;

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinderPattern(r, c, matrixSize)) continue;
      if (logoEnabled && isLogoArea(r, c, matrixSize, logoRatio + 0.04)) continue;

      if (qr.modules.get(r, c)) {
        const x = qrX + (c + margin) * effectiveCellSize;
        const y = qrY + (r + margin) * effectiveCellSize;

        if (effectiveModuleShape === "dots") {
          ctx.beginPath();
          ctx.arc(x + effectiveCellSize / 2, y + effectiveCellSize / 2, effectiveCellSize * 0.42, 0, Math.PI * 2);
          ctx.fill();
        } else if (effectiveModuleShape === "rounded") {
          const radius = effectiveCellSize * 0.3;
          drawRoundedRect(ctx, x, y, effectiveCellSize, effectiveCellSize, radius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, effectiveCellSize, effectiveCellSize);
        }
      }
    }
  }

  // 3. Draw Finder Patterns (Corner Eyes)
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: matrixSize - 7 },
    { r: matrixSize - 7, c: 0 },
  ];

  for (const pos of finderPositions) {
    const x = qrX + (pos.c + margin) * effectiveCellSize;
    const y = qrY + (pos.r + margin) * effectiveCellSize;
    const eyeSize = 7 * effectiveCellSize;

    drawFinderEye(
      ctx,
      x,
      y,
      eyeSize,
      effectiveCellSize,
      effectiveEyeShape,
      effectiveEyeOuterColor,
      effectiveEyeInnerColor,
      lightColor
    );
  }

  // 4. Draw Central Logo Badge if enabled and not simple
  if (logoEnabled && logoImg) {
    const logoPixelSize = qrRenderSize * logoRatio;
    const logoX = qrX + (qrRenderSize - logoPixelSize) / 2;
    const logoY = qrY + (qrRenderSize - logoPixelSize) / 2;
    const pad = effectiveCellSize * 0.8;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 3;

    ctx.fillStyle = logo?.backgroundColor || "#FFFFFF";
    const bgX = logoX - pad;
    const bgY = logoY - pad;
    const bgSize = logoPixelSize + pad * 2;
    const cornerRadius = logo?.borderRadius !== undefined ? logo.borderRadius : bgSize * 0.28;

    drawRoundedRect(ctx, bgX, bgY, bgSize, bgSize, cornerRadius);
    ctx.fill();

    ctx.shadowColor = "transparent";
    ctx.strokeStyle = effectiveEyeOuterColor || "#C8963E";
    ctx.lineWidth = Math.max(2, size * 0.003);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    drawRoundedRect(ctx, logoX, logoY, logoPixelSize, logoPixelSize, cornerRadius * 0.7);
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoPixelSize, logoPixelSize);
    ctx.restore();
  }
}

/**
 * Draws curved text around a circle for the circular stamp variant.
 */
function drawCurvedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  color: string,
  fontSize: number
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const chars = text.split("");
  const totalAngle = Math.PI * 0.75;
  const angleStep = totalAngle / Math.max(1, chars.length - 1);
  const initialAngle = startAngle - totalAngle / 2;

  for (let i = 0; i < chars.length; i++) {
    const charAngle = initialAngle + i * angleStep;
    const x = cx + radius * Math.cos(charAngle);
    const y = cy + radius * Math.sin(charAngle);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(charAngle + Math.PI / 2);
    ctx.fillText(chars[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Draws one of the 7x7 Finder Eyes.
 */
function drawFinderEye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  eyeSize: number,
  cellSize: number,
  shape: QrEyeShape,
  outerColor: string,
  innerColor: string,
  bgColor: string
) {
  const outerRadius = shape === "circle" ? eyeSize / 2 : shape === "rounded" ? cellSize * 1.8 : 0;
  const innerSpaceRadius = shape === "circle" ? (5 * cellSize) / 2 : shape === "rounded" ? cellSize * 1.3 : 0;
  const pipRadius = shape === "circle" ? (3 * cellSize) / 2 : shape === "rounded" ? cellSize * 0.9 : 0;

  // Outer 7x7 square/circle
  ctx.fillStyle = outerColor;
  drawRoundedRect(ctx, x, y, eyeSize, eyeSize, outerRadius);
  ctx.fill();

  // White inner 5x5 cutout
  ctx.fillStyle = bgColor;
  drawRoundedRect(ctx, x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize, innerSpaceRadius);
  ctx.fill();

  // Inner 3x3 solid pip
  ctx.fillStyle = innerColor;
  drawRoundedRect(ctx, x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize, pipRadius);
  ctx.fill();
}

/**
 * Helper to draw a rounded rectangle path.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  if (r <= 0) {
    ctx.rect(x, y, w, h);
    return;
  }
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/**
 * Generates a clean, pure Vector SVG string for Adobe Illustrator, Figma, or web display.
 */
export async function generateSvgQr(options: QrRenderOptions): Promise<string> {
  const {
    url,
    variant = "branded",
    margin = 2,
    errorCorrectionLevel = "H",
    darkColor = "#09162D",
    lightColor = "#FFFFFF",
    eyeOuterColor = "#C8963E",
    eyeInnerColor = "#09162D",
    moduleShape = "rounded",
    logo,
  } = options;

  const isSimple = variant === "simple";
  const qr = QRCode.create(url, {
    errorCorrectionLevel: isSimple ? (options.errorCorrectionLevel || "M") : errorCorrectionLevel,
  });

  const matrixSize = qr.modules.size;
  const totalCells = matrixSize + margin * 2;
  const cellSize = 10;
  const totalSize = totalCells * cellSize;

  const logoEnabled = !isSimple && logo?.enabled;
  const logoRatio = logoEnabled ? (logo?.sizeRatio || 0.22) : 0;

  const effectiveModuleShape = isSimple ? "square" : moduleShape;
  const effectiveEyeOuterColor = isSimple ? darkColor : eyeOuterColor;
  const effectiveEyeInnerColor = isSimple ? darkColor : eyeInnerColor;

  const rects: string[] = [];

  // Data modules
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinderPattern(r, c, matrixSize)) continue;
      if (logoEnabled && isLogoArea(r, c, matrixSize, logoRatio + 0.04)) continue;

      if (qr.modules.get(r, c)) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        const rx = effectiveModuleShape === "dots" ? cellSize / 2 : effectiveModuleShape === "rounded" ? 3 : 0;

        rects.push(
          `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${rx}" fill="${darkColor}" />`
        );
      }
    }
  }

  // Finder Patterns
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: matrixSize - 7 },
    { r: matrixSize - 7, c: 0 },
  ];

  const eyes: string[] = [];
  for (const pos of finderPositions) {
    const x = (pos.c + margin) * cellSize;
    const y = (pos.r + margin) * cellSize;
    const outerRx = effectiveModuleShape === "square" ? 0 : 12;
    const innerSpaceRx = effectiveModuleShape === "square" ? 0 : 8;
    const pipRx = effectiveModuleShape === "square" ? 0 : 6;

    eyes.push(`
      <rect x="${x}" y="${y}" width="${7 * cellSize}" height="${7 * cellSize}" rx="${outerRx}" fill="${effectiveEyeOuterColor}" />
      <rect x="${x + cellSize}" y="${y + cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" rx="${innerSpaceRx}" fill="${lightColor}" />
      <rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" rx="${pipRx}" fill="${effectiveEyeInnerColor}" />
    `);
  }

  // Central logo cutout box if logo enabled
  let logoSvg = "";
  if (logoEnabled) {
    const logoPx = totalSize * logoRatio;
    const pad = cellSize * 0.8;
    const bgPx = logoPx + pad * 2;
    const bgX = (totalSize - bgPx) / 2;
    const bgY = (totalSize - bgPx) / 2;

    logoSvg = `
      <rect x="${bgX}" y="${bgY}" width="${bgPx}" height="${bgPx}" rx="${bgPx * 0.28}" fill="${logo.backgroundColor || '#FFFFFF'}" stroke="${effectiveEyeOuterColor}" stroke-width="2" />
      <text x="${totalSize / 2}" y="${totalSize / 2 + 5}" font-family="system-ui, sans-serif" font-weight="900" font-size="${bgPx * 0.35}" fill="${darkColor}" text-anchor="middle">AM</text>
    `;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}" shape-rendering="geometricPrecision">
  <rect width="${totalSize}" height="${totalSize}" fill="${lightColor}" />
  <g id="data-modules">
    ${rects.join("\n    ")}
  </g>
  <g id="finder-eyes">
    ${eyes.join("\n    ")}
  </g>
  ${logoSvg}
</svg>`;
}

/**
 * Generates high-res PNG data URL.
 */
export async function generatePngDataUrl(options: QrRenderOptions): Promise<string> {
  const {
    url,
    size = 1200,
    margin = 2,
    errorCorrectionLevel = "H",
    darkColor = "#09162D",
    lightColor = "#FFFFFF",
  } = options;

  return await QRCode.toDataURL(url, {
    errorCorrectionLevel,
    margin,
    width: size,
    color: {
      dark: darkColor,
      light: lightColor,
    },
  });
}
