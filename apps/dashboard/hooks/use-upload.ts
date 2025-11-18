"use client";

import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UploadFileOptions {
  file: File;
  path: string[];
  bucket: string;
}

interface UploadResult {
  url: string;
}

export function useUpload() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const uploadFile = async ({
    file,
    path,
    bucket,
  }: UploadFileOptions): Promise<UploadResult> => {
    setIsLoading(true);

    try {
      // TODO: Implement actual file upload logic
      // For now, return a placeholder URL
      const formData = new FormData();
      formData.append("file", file);
      formData.append("path", path.join("/"));
      formData.append("bucket", bucket);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      return { url: data.url };
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { uploadFile, isLoading };
}

