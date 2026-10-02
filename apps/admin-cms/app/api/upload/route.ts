import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionFromRequest } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "u4yskxlf";
    const apiKey = process.env.CLOUDINARY_API_KEY || "391772554451951";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "sAA_nRDi2KbGNp7015bxZS91Bqk";

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { message: "Cloudinary credentials missing from server configuration" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "arukamed/employees";

    if (!file) {
      return NextResponse.json({ message: "No file provided for upload" }, { status: 400 });
    }

    // Validate mime type
    const validMimes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (!validMimes.includes(file.type)) {
      return NextResponse.json(
        { message: "Invalid file type. Only JPG, PNG, WEBP, and AVIF image formats are supported." },
        { status: 400 }
      );
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File exceeds 10MB limit. Please upload a smaller photograph." },
        { status: 400 }
      );
    }

    // Convert file to base64 Data URI for reliable Cloudinary transmission
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64DataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    const timestamp = Math.floor(Date.now() / 1000);
    // Cloudinary signature calculation: sorted keys
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto.createHash("sha1").update(`${paramsToSign}${apiSecret}`).digest("hex");

    const uploadFormData = new FormData();
    uploadFormData.append("file", base64DataUri);
    uploadFormData.append("api_key", apiKey);
    uploadFormData.append("timestamp", String(timestamp));
    uploadFormData.append("folder", folder);
    uploadFormData.append("signature", signature);

    const cloudinaryRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: uploadFormData,
      }
    );

    const result = await cloudinaryRes.json();

    if (!cloudinaryRes.ok) {
      return NextResponse.json(
        { message: result.error?.message || "Failed to upload image to Cloudinary" },
        { status: cloudinaryRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error?.message || "Internal server error during upload" },
      { status: 500 }
    );
  }
}
