/**
 * Customer Photo Upload API
 * Allow customers to upload delivery photos
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const photo = formData.get("photo") as File;
    const loadSheetId = formData.get("loadSheetId") as string;

    if (!photo || !loadSheetId) {
      return NextResponse.json(
        { error: "Photo and load sheet ID are required" },
        { status: 400 },
      );
    }

    // Verify load sheet exists
    const loadSheet = await prisma.loadSheet.findUnique({
      where: { id: loadSheetId },
    });

    if (!loadSheet) {
      return NextResponse.json(
        { error: "Load sheet not found" },
        { status: 404 },
      );
    }

    // Convert file to buffer
    const bytes = await photo.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory if it doesn't exist
    const uploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      "delivery-photos",
    );
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = photo.name.split(".").pop();
    const filename = `${loadSheet.loadSheetNumber}-${timestamp}.${extension}`;
    const filepath = join(uploadDir, filename);

    // Save file
    await writeFile(filepath, buffer);

    // TODO: Upload to S3 in production
    // const s3Url = await uploadToS3(buffer, filename);

    // Store photo reference in database
    const photoUrl = `/uploads/delivery-photos/${filename}`;

    // Add to load sheet metadata or create new table for photos
    await prisma.loadSheet.update({
      where: { id: loadSheetId },
      data: {
        metadata: {
          ...(loadSheet.metadata as any),
          deliveryPhotos: [
            ...((loadSheet.metadata as any)?.deliveryPhotos || []),
            {
              url: photoUrl,
              uploadedAt: new Date().toISOString(),
            },
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      photoUrl,
      message: "Photo uploaded successfully",
    });
  } catch (error) {
    console.error("Photo upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 },
    );
  }
}
