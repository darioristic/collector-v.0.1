import type { LucideIcon } from "lucide-react";
import {
  FileArchive,
  FileAudio,
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Folder,
  Presentation,
  File as GenericFile
} from "lucide-react";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric"
});

const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "heic", "tiff"];
const AUDIO_EXTENSIONS = ["mp3", "wav", "aac", "ogg", "flac", "m4a"];
const VIDEO_EXTENSIONS = ["mp4", "mov", "avi", "mkv", "webm"];
const ARCHIVE_EXTENSIONS = ["zip", "rar", "7z", "tar", "gz", "bz2"];
const CODE_EXTENSIONS = ["ts", "tsx", "js", "jsx", "json", "html", "css", "scss", "sass", "py", "rb", "go", "java", "cs"];
const DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "txt", "md"];
const PRESENTATION_EXTENSIONS = ["ppt", "pptx", "key"];
const SHEET_EXTENSIONS = ["xls", "xlsx", "csv", "ods"];

const iconRegistry: Record<string, LucideIcon> = {
  folder: Folder,
  archive: FileArchive,
  audio: FileAudio,
  video: FileVideo,
  image: FileImage,
  code: FileCode2,
  document: FileText,
  presentation: Presentation,
  sheet: FileSpreadsheet,
  generic: GenericFile
};

const resolveExtension = (name: string): string => {
  const [, extension = ""] = name.toLowerCase().split(".").slice(-2);
  return extension;
};

const resolveFileCategory = (mimeType?: string | null, name?: string | null): keyof typeof iconRegistry => {
  if (!name && !mimeType) {
    return "generic";
  }

  const mime = mimeType?.toLowerCase() ?? "";
  const extension = name ? resolveExtension(name) : "";

  if (mime.startsWith("image/") || IMAGE_EXTENSIONS.includes(extension)) {
    return "image";
  }
  if (mime.startsWith("audio/") || AUDIO_EXTENSIONS.includes(extension)) {
    return "audio";
  }
  if (mime.startsWith("video/") || VIDEO_EXTENSIONS.includes(extension)) {
    return "video";
  }
  if (mime === "application/pdf" || DOCUMENT_EXTENSIONS.includes(extension)) {
    return "document";
  }
  if (mime.includes("presentation") || PRESENTATION_EXTENSIONS.includes(extension)) {
    return "presentation";
  }
  if (mime.includes("spreadsheet") || SHEET_EXTENSIONS.includes(extension)) {
    return "sheet";
  }
  if (
    mime.includes("zip") ||
    mime.includes("compressed") ||
    ARCHIVE_EXTENSIONS.includes(extension)
  ) {
    return "archive";
  }
  if (
    mime.includes("json") ||
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    CODE_EXTENSIONS.includes(extension)
  ) {
    return "code";
  }

  return "generic";
};

export const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "0 B";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const order = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_UNITS.length - 1);
  const value = bytes / Math.pow(1024, order);

  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${SIZE_UNITS[order]}`;
};

export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return dateFormatter.format(date);
};

export const getVaultIcon = (params: {
  kind: "folder" | "file";
  mimeType?: string | null;
  name?: string | null;
}): LucideIcon => {
  if (params.kind === "folder") {
    return iconRegistry.folder;
  }

  return iconRegistry[resolveFileCategory(params.mimeType, params.name)] ?? iconRegistry.generic;
};


