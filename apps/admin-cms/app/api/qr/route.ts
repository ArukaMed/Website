import { NextRequest, NextResponse } from "next/server";
import { generateSvgQr, generatePngDataUrl } from "@/lib/qr-engine";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get("url");
  const format = searchParams.get("format") || "svg";

  if (!targetUrl) {
    return NextResponse.json({ message: "URL parameter required" }, { status: 400 });
  }

  try {
    if (format === "png") {
      const dataUrl = await generatePngDataUrl({ url: targetUrl });
      return NextResponse.json({ dataUrl });
    }

    const svg = await generateSvgQr({ url: targetUrl });
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || "QR Generation failed" }, { status: 500 });
  }
}
