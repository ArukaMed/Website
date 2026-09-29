import QRCode from "qrcode";

export interface QrOptions {
  url: string;
  darkColor?: string;
  lightColor?: string;
}

export async function generateSvgQr(options: QrOptions): Promise<string> {
  return await QRCode.toString(options.url, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 1,
    color: {
      dark: options.darkColor || "#0C2244",
      light: options.lightColor || "#FFFFFF",
    },
  });
}

export async function generatePngDataUrl(options: QrOptions): Promise<string> {
  return await QRCode.toDataURL(options.url, {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 600,
    color: {
      dark: options.darkColor || "#0C2244",
      light: options.lightColor || "#FFFFFF",
    },
  });
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
  };
}

export function getCommercialPrintSpec(): PrintCardSpec {
  return {
    dimensionsInches: '3.5" x 2.0"',
    dimensionsPoints: "252pt x 144pt",
    bleedInches: '0.125" all sides',
    resolutionDpi: 300,
    cmykColorCodes: {
      primaryDeep: "C: 85%, M: 65%, Y: 15%, K: 65% (Pantone 296 C match)",
      accentGold: "C: 15%, M: 35%, Y: 85%, K: 5% (Pantone 7555 C match)",
      textBlack: "C: 0%, M: 0%, Y: 0%, K: 100%",
    },
  };
}
