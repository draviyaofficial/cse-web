"use client";

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function ImageUpload({
  value,
  onChange,
  disabled,
}: ImageUploadProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error("Missing Cloudinary configuration");
      console.error("Cloudinary env vars missing");
      return;
    }

    const file = acceptedFiles[0];

    // File validation
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large (max 5MB)");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file type. Please upload an image.");
      return;
    }

    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET!);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open(
        "POST",
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      );

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log("Cloudinary response:", response);

          const url = response.secure_url || response.url;
          if (url) {
            onChange(url);
            toast.success("Image uploaded successfully");
          } else {
            console.error("No URL in response", response);
            toast.error("Upload successful but URL missing.");
          }
        } else {
          console.error("Upload failed", xhr.responseText);
          toast.error("Upload failed. Please try again.");
        }
        setLoading(false);
      };

      xhr.onerror = () => {
        console.error("Upload error");
        toast.error("Upload failed. Network error.");
        setLoading(false);
      };

      xhr.send(formData);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Something went wrong during upload");
      setLoading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/webp": [],
      "image/gif": [],
    },
    maxFiles: 1,
    disabled: disabled || loading,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="w-full">
      {value ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 sm:aspect-21/9">
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={value}
              alt="Upload"
              fill
              className="object-contain p-2"
            />
          </div>
          <button
            onClick={handleRemove}
            className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-sm transition hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 z-10"
            type="button"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 transition hover:bg-zinc-100",
            isDragActive && "border-[#F2723B] bg-orange-50",
            (disabled || loading) &&
              "cursor-not-allowed opacity-60 pointer-events-none",
          )}
        >
          <input {...getInputProps()} />
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 w-full max-w-xs">
              <Loader2 className="h-8 w-8 animate-spin text-[#F2723B]" />
              <div className="w-full space-y-1">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full bg-[#F2723B] transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="mb-4 rounded-full bg-zinc-100 p-3">
                <Upload className="h-6 w-6 text-zinc-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-zinc-700">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-zinc-500">
                  SVG, PNG, JPG or GIF (max. 5MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
