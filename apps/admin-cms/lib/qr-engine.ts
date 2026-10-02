import QRCode from "qrcode";

export type QrStylePreset = "aruka-gold" | "corporate-navy" | "monochrome-dark" | "luxury-dark";
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
  size?: number; // Resolution in px (e.g. 600, 1200, 2400)
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
  darkColor: string;
  lightColor: string;
  eyeOuterColor: string;
  eyeInnerColor: string;
  moduleShape: QrModuleShape;
  eyeShape: QrEyeShape;
}> = {
  "aruka-gold": {
    name: "Aruka Executive Gold & Navy",
    description: "Deep Navy modules with signature Aruka Gold finder eyes on crisp ivory.",
    darkColor: "#09162D",
    lightColor: "#FFFFFF",
    eyeOuterColor: "#C8963E",
    eyeInnerColor: "#09162D",
    moduleShape: "rounded",
    eyeShape: "rounded",
  },
  "corporate-navy": {
    name: "Corporate Deep Navy",
    description: "Uniform Aruka Deep Navy (#09162D) on clean white background.",
    darkColor: "#09162D",
    lightColor: "#FFFFFF",
    eyeOuterColor: "#09162D",
    eyeInnerColor: "#09162D",
    moduleShape: "square",
    eyeShape: "square",
  },
  "monochrome-dark": {
    name: "Industrial Offset Black",
    description: "Pure #000000 on #FFFFFF for high-contrast commercial thermal and laser printing.",
    darkColor: "#000000",
    lightColor: "#FFFFFF",
    eyeOuterColor: "#000000",
    eyeInnerColor: "#000000",
    moduleShape: "square",
    eyeShape: "square",
  },
  "luxury-dark": {
    name: "Luxury Inverted Metal Card",
    description: "Warm Gold modules on Midnight Navy backing for metal, NFC, and dark-card finishes.",
    darkColor: "#E3B15F",
    lightColor: "#09162D",
    eyeOuterColor: "#C8963E",
    eyeInnerColor: "#FFFFFF",
    moduleShape: "rounded",
    eyeShape: "rounded",
  },
};

/**
 * Checks whether a module at (r, c) falls inside one of the three 7x7 finder patterns.
 */
export function isFinderPattern(r: number, c: number, size: number): boolean {
  // Top-left finder: [0..6, 0..6]
  if (r <= 6 && c <= 6) return true;
  // Top-right finder: [0..6, (size-7)..size-1]
  if (r <= 6 && c >= size - 7) return true;
  // Bottom-left finder: [(size-7)..size-1, 0..6]
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
 */
export function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  options: QrRenderOptions,
  logoImg?: HTMLImageElement | null
): void {
  const {
    url,
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

  const qr = QRCode.create(url, {
    errorCorrectionLevel,
  });

  const matrixSize = qr.modules.size;
  const totalCells = matrixSize + margin * 2;
  const cellSize = size / totalCells;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Draw Background
  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, size, size);

  const logoEnabled = logo?.enabled && logoImg && logoImg.complete && logoImg.naturalWidth > 0;
  const logoRatio = logoEnabled ? (logo?.sizeRatio || 0.22) : 0;

  // 2. Draw Data Modules (skipping Finder Patterns and Logo Cutout)
  ctx.fillStyle = darkColor;

  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinderPattern(r, c, matrixSize)) continue;
      if (logoEnabled && isLogoArea(r, c, matrixSize, logoRatio + 0.04)) continue;

      if (qr.modules.get(r, c)) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;

        if (moduleShape === "dots") {
          ctx.beginPath();
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.42, 0, Math.PI * 2);
          ctx.fill();
        } else if (moduleShape === "rounded") {
          const radius = cellSize * 0.3;
          drawRoundedRect(ctx, x, y, cellSize, cellSize, radius);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      }
    }
  }

  // 3. Draw Finder Patterns (Corner Eyes) with Custom Styling
  const finderPositions = [
    { r: 0, c: 0 }, // Top-left
    { r: 0, c: matrixSize - 7 }, // Top-right
    { r: matrixSize - 7, c: 0 }, // Bottom-left
  ];

  for (const pos of finderPositions) {
    const x = (pos.c + margin) * cellSize;
    const y = (pos.r + margin) * cellSize;
    const eyeSize = 7 * cellSize;

    drawFinderEye(ctx, x, y, eyeSize, cellSize, eyeShape, eyeOuterColor, eyeInnerColor, lightColor);
  }

  // 4. Draw Central Logo Badge if enabled
  if (logoEnabled && logoImg) {
    const logoPixelSize = size * logoRatio;
    const logoX = (size - logoPixelSize) / 2;
    const logoY = (size - logoPixelSize) / 2;
    const pad = cellSize * 0.8;

    // Draw background backing with subtle border & shadow
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

    // Subtle outline border around badge
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = eyeOuterColor || "#C8963E";
    ctx.lineWidth = Math.max(2, size * 0.003);
    ctx.stroke();
    ctx.restore();

    // Draw image inside badge
    ctx.save();
    drawRoundedRect(ctx, logoX, logoY, logoPixelSize, logoPixelSize, cornerRadius * 0.7);
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoPixelSize, logoPixelSize);
    ctx.restore();
  }
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
    margin = 2,
    errorCorrectionLevel = "H",
    darkColor = "#09162D",
    lightColor = "#FFFFFF",
    eyeOuterColor = "#C8963E",
    eyeInnerColor = "#09162D",
    moduleShape = "rounded",
    logo,
  } = options;

  const qr = QRCode.create(url, { errorCorrectionLevel });
  const matrixSize = qr.modules.size;
  const totalCells = matrixSize + margin * 2;
  const cellSize = 10;
  const totalSize = totalCells * cellSize;

  const logoEnabled = logo?.enabled;
  const logoRatio = logoEnabled ? (logo?.sizeRatio || 0.22) : 0;

  const rects: string[] = [];

  // Data modules
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (isFinderPattern(r, c, matrixSize)) continue;
      if (logoEnabled && isLogoArea(r, c, matrixSize, logoRatio + 0.04)) continue;

      if (qr.modules.get(r, c)) {
        const x = (c + margin) * cellSize;
        const y = (r + margin) * cellSize;
        const rx = moduleShape === "dots" ? cellSize / 2 : moduleShape === "rounded" ? 3 : 0;

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
    const outerRx = moduleShape === "square" ? 0 : 12;
    const innerSpaceRx = moduleShape === "square" ? 0 : 8;
    const pipRx = moduleShape === "square" ? 0 : 6;

    eyes.push(`
      <rect x="${x}" y="${y}" width="${7 * cellSize}" height="${7 * cellSize}" rx="${outerRx}" fill="${eyeOuterColor}" />
      <rect x="${x + cellSize}" y="${y + cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" rx="${innerSpaceRx}" fill="${lightColor}" />
      <rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" rx="${pipRx}" fill="${eyeInnerColor}" />
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
      <rect x="${bgX}" y="${bgY}" width="${bgPx}" height="${bgPx}" rx="${bgPx * 0.28}" fill="${logo.backgroundColor || '#FFFFFF'}" stroke="${eyeOuterColor}" stroke-width="2" />
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
