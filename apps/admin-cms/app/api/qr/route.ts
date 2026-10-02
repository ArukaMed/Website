import { NextRequest, NextResponse } from "next/server";
import { generateSvgQr, generatePngDataUrl, QrModuleShape, QrEyeShape } from "@/lib/qr-engine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");
  const format = searchParams.get("format") || "svg";
  const download = searchParams.get("download") === "true";
  const filename = searchParams.get("filename") || "arukamed-qr";

  if (!targetUrl) {
    return NextResponse.json({ message: "URL parameter required" }, { status: 400 });
  }

  const options = {
    url: targetUrl,
    size: parseInt(searchParams.get("size") || "1200", 10),
    margin: parseInt(searchParams.get("margin") || "2", 10),
    darkColor: searchParams.get("darkColor") || "#000000",
    lightColor: searchParams.get("lightColor") || "#FFFFFF",
    transparentBg: searchParams.get("transparent") !== "false",
    eyeOuterColor: searchParams.get("eyeOuterColor") || "#C8963E",
    eyeInnerColor: searchParams.get("eyeInnerColor") || "#09162D",
    moduleShape: (searchParams.get("moduleShape") as QrModuleShape) || "rounded",
    eyeShape: (searchParams.get("eyeShape") as QrEyeShape) || "rounded",
    errorCorrectionLevel: (searchParams.get("ec") as "L" | "M" | "Q" | "H") || "H",
    logo: {
      enabled: searchParams.get("logo") === "true",
      sizeRatio: 0.22,
    },
  };

  try {
    if (format === "png") {
      const dataUrl = await generatePngDataUrl(options);
      if (download) {
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type": "image/png",
            "Content-Disposition": `attachment; filename="${filename}.png"`,
            "Cache-Control": "public, max-age=86400",
          },
        });
      }
      return NextResponse.json({ dataUrl });
    }

    const svg = await generateSvgQr(options);
    const headers: Record<string, string> = {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400",
    };

    if (download) {
      headers["Content-Disposition"] = `attachment; filename="${filename}.svg"`;
    }

    return new NextResponse(svg, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "QR Generation failed" }, { status: 500 });
  }
}
