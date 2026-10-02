import QRCode from "qrcode";

export type QrModuleShape = "square" | "rounded" | "dots";
export type QrEyeShape = "square" | "rounded" | "circle";

export interface QrLogoConfig {
  enabled: boolean;
  src?: string;
  sizeRatio?: number; // 0.18 to 0.25 (default 0.22)
  backgroundColor?: string;
  borderRadius?: number;
}

export interface QrRenderOptions {
  url: string;
  size?: number; // Resolution in px (e.g. 600, 1024, 2400)
  margin?: number; // Margin in modules (0, 1, 2, 4)
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"; // Default: 'H'
  darkColor?: string; // Module & foreground color
  lightColor?: string; // Background color (used when transparentBg is false)
  transparentBg?: boolean; // If true, background is 100% transparent PNG
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
 * Fully supports transparent backgrounds (alpha = 0) for effortless designer use.
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
    darkColor = "#000000",
    lightColor = "#FFFFFF",
    transparentBg = true,
    eyeOuterColor = darkColor,
    eyeInnerColor = darkColor,
    moduleShape = "square",
    eyeShape = "square",
    logo,
  } = options;

  const qr = QRCode.create(url, { errorCorrectionLevel });
  const matrixSize = qr.modules.size;
  const totalCells = matrixSize + margin * 2;
  const cellSize = size / totalCells;

  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 1. Draw Background
  if (transparentBg || lightColor === "transparent") {
    ctx.clearRect(0, 0, size, size);
  } else {
    ctx.fillStyle = lightColor;
    ctx.fillRect(0, 0, size, size);
  }

  const logoEnabled = logo?.enabled && logoImg && logoImg.complete && logoImg.naturalWidth > 0;
  const logoRatio = logoEnabled ? (logo?.sizeRatio || 0.22) : 0;

  // 2. Draw Data Modules
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
          ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.44, 0, Math.PI * 2);
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

  // 3. Draw Finder Patterns (Corner Eyes) with Hollow Transparency
  const finderPositions = [
    { r: 0, c: 0 },
    { r: 0, c: matrixSize - 7 },
    { r: matrixSize - 7, c: 0 },
  ];

  for (const pos of finderPositions) {
    const x = (pos.c + margin) * cellSize;
    const y = (pos.r + margin) * cellSize;
    const eyeSize = 7 * cellSize;

    drawFinderEye(
      ctx,
      x,
      y,
      eyeSize,
      cellSize,
      eyeShape,
      eyeOuterColor,
      eyeInnerColor,
      lightColor,
      transparentBg
    );
  }

  // 4. Draw Central Logo Badge if enabled
  if (logoEnabled && logoImg) {
    const logoPixelSize = size * logoRatio;
    const logoX = (size - logoPixelSize) / 2;
    const logoY = (size - logoPixelSize) / 2;
    const pad = cellSize * 0.7;

    // Backing box behind logo
    ctx.save();
    ctx.fillStyle = logo?.backgroundColor || "#FFFFFF";
    const bgX = logoX - pad;
    const bgY = logoY - pad;
    const bgSize = logoPixelSize + pad * 2;
    const cornerRadius = logo?.borderRadius !== undefined ? logo.borderRadius : bgSize * 0.25;

    drawRoundedRect(ctx, bgX, bgY, bgSize, bgSize, cornerRadius);
    ctx.fill();

    // Border around badge
    ctx.strokeStyle = eyeOuterColor || darkColor;
    ctx.lineWidth = Math.max(2, size * 0.003);
    ctx.stroke();
    ctx.restore();

    // Draw logo image
    ctx.save();
    drawRoundedRect(ctx, logoX, logoY, logoPixelSize, logoPixelSize, cornerRadius * 0.7);
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoPixelSize, logoPixelSize);
    ctx.restore();
  }
}

/**
 * Draws one of the 7x7 Finder Eyes.
 * If transparentBg is true, creates a true hollow 1-module border so background stays transparent.
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
  bgColor: string,
  transparentBg: boolean
) {
  const outerRadius = shape === "circle" ? eyeSize / 2 : shape === "rounded" ? cellSize * 1.8 : 0;
  const pipRadius = shape === "circle" ? (3 * cellSize) / 2 : shape === "rounded" ? cellSize * 0.9 : 0;

  if (transparentBg) {
    // Hollow outer 7x7 ring with 1-cell line width
    ctx.save();
    ctx.strokeStyle = outerColor;
    ctx.lineWidth = cellSize;
    const offset = cellSize / 2;
    drawRoundedRect(ctx, x + offset, y + offset, eyeSize - cellSize, eyeSize - cellSize, outerRadius);
    ctx.stroke();
    ctx.restore();

    // Solid inner 3x3 pip
    ctx.save();
    ctx.fillStyle = innerColor;
    drawRoundedRect(ctx, x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize, pipRadius);
    ctx.fill();
    ctx.restore();
  } else {
    // Solid background with filled white gap
    const innerSpaceRadius = shape === "circle" ? (5 * cellSize) / 2 : shape === "rounded" ? cellSize * 1.3 : 0;

    ctx.fillStyle = outerColor;
    drawRoundedRect(ctx, x, y, eyeSize, eyeSize, outerRadius);
    ctx.fill();

    ctx.fillStyle = bgColor;
    drawRoundedRect(ctx, x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize, innerSpaceRadius);
    ctx.fill();

    ctx.fillStyle = innerColor;
    drawRoundedRect(ctx, x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize, pipRadius);
    ctx.fill();
  }
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
 * Omits background rectangle if transparentBg is true.
 */
export async function generateSvgQr(options: QrRenderOptions): Promise<string> {
  const {
    url,
    margin = 2,
    errorCorrectionLevel = "H",
    darkColor = "#000000",
    lightColor = "#FFFFFF",
    transparentBg = true,
    eyeOuterColor = darkColor,
    eyeInnerColor = darkColor,
    moduleShape = "square",
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
    const pipRx = moduleShape === "square" ? 0 : 6;

    if (transparentBg) {
      // Hollow outer frame (no background fill)
      eyes.push(`
        <rect x="${x + cellSize / 2}" y="${y + cellSize / 2}" width="${6 * cellSize}" height="${6 * cellSize}" rx="${outerRx}" fill="none" stroke="${eyeOuterColor}" stroke-width="${cellSize}" />
        <rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" rx="${pipRx}" fill="${eyeInnerColor}" />
      `);
    } else {
      const innerSpaceRx = moduleShape === "square" ? 0 : 8;
      eyes.push(`
        <rect x="${x}" y="${y}" width="${7 * cellSize}" height="${7 * cellSize}" rx="${outerRx}" fill="${eyeOuterColor}" />
        <rect x="${x + cellSize}" y="${y + cellSize}" width="${5 * cellSize}" height="${5 * cellSize}" rx="${innerSpaceRx}" fill="${lightColor}" />
        <rect x="${x + 2 * cellSize}" y="${y + 2 * cellSize}" width="${3 * cellSize}" height="${3 * cellSize}" rx="${pipRx}" fill="${eyeInnerColor}" />
      `);
    }
  }

  // Background rect (only if not transparent)
  const bgSvg = transparentBg ? "" : `<rect width="${totalSize}" height="${totalSize}" fill="${lightColor}" />`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}" shape-rendering="geometricPrecision">
  ${bgSvg}
  <g id="data-modules">
    ${rects.join("\n    ")}
  </g>
  <g id="finder-eyes">
    ${eyes.join("\n    ")}
  </g>
</svg>`;
}

/**
 * Generates high-res PNG data URL with transparent background support.
 */
export async function generatePngDataUrl(options: QrRenderOptions): Promise<string> {
  const {
    url,
    size = 1200,
    margin = 2,
    errorCorrectionLevel = "H",
    darkColor = "#000000",
    lightColor = "#FFFFFF",
    transparentBg = true,
  } = options;

  return await QRCode.toDataURL(url, {
    errorCorrectionLevel,
    margin,
    width: size,
    color: {
      dark: darkColor,
      light: transparentBg ? "#00000000" : lightColor,
    },
  });
}
