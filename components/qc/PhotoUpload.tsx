"use client";

import { useState } from "react";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PhotoUploadProps {
  value: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
  required?: boolean;
}

export function PhotoUpload({
  value = [],
  onChange,
  maxPhotos = 10,
  label = "Photos",
  required = false,
}: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (!files) return;

    if (value.length + files.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      onChange([...value, ...data.urls]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload photos");
    } finally {
      setUploading(false);
    }
  };

  const handleCapture = async () => {
    // Trigger camera capture on mobile devices
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.multiple = true;
    input.onchange = handleFileSelect as any;
    input.click();
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...value];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <span className="text-sm text-muted-foreground">
          {value.length} / {maxPhotos}
        </span>
      </div>

      {/* Photo Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {value.map((photo, index) => (
            <Card
              key={index}
              className="relative aspect-square overflow-hidden"
            >
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute right-1 top-1 h-6 w-6"
                onClick={() => removePhoto(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Buttons */}
      {value.length < maxPhotos && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleCapture}
            disabled={uploading}
          >
            <Camera className="mr-2 h-4 w-4" />
            {uploading ? "Uploading..." : "Take Photo"}
          </Button>

          <label className="flex-1">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={uploading}
              onClick={() => document.getElementById("photo-upload")?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {value.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
          <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No photos added yet</p>
        </div>
      )}
    </div>
  );
}
