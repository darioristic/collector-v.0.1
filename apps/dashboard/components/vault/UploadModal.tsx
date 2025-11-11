"use client";

import { useEffect, useId, useMemo, useState } from "react";

import type { VaultDirectoryOption } from "@/app/vault/types";
import { formatBytes } from "@/components/vault/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFileUpload } from "@/hooks/use-file-upload";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FileText, Trash2, UploadCloud } from "lucide-react";

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  folders: VaultDirectoryOption[];
  defaultFolderId?: string | null;
  uploadedBy?: string | null;
  onUpload: (_formData: FormData) => Promise<unknown>;
  maxFileSizeBytes?: number;
};

const DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB

export function UploadModal({
  isOpen,
  onClose,
  folders,
  defaultFolderId,
  uploadedBy,
  onUpload,
  maxFileSizeBytes = DEFAULT_MAX_SIZE
}: UploadModalProps) {
  const { toast } = useToast();

  const selectId = useId();

  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const [state, actions] = useFileUpload({
    multiple: true,
    maxSize: maxFileSizeBytes
  });

  const rootOption = useMemo(() => folders.find((item) => item.id === null), [folders]);

  const folderMap = useMemo(() => {
    const map = new Map<string, VaultDirectoryOption>();
    folders.forEach((folder) => {
      if (folder.id) {
        map.set(folder.id, folder);
      }
    });
    return map;
  }, [folders]);

  const folderOptions = useMemo(() => {
    const buildPath = (folder: VaultDirectoryOption): string => {
      const parts = [folder.name];
      let currentParentId = folder.parentId;

      while (currentParentId) {
        const parent = folderMap.get(currentParentId);
        if (!parent) {
          break;
        }
        parts.push(parent.name);
        currentParentId = parent.parentId;
      }

      if (rootOption) {
        parts.push(rootOption.name);
      }

      return parts.reverse().join(" / ");
    };

    return folders
      .filter((folder): folder is VaultDirectoryOption & { id: string } => Boolean(folder.id))
      .map((folder) => ({
        id: folder.id,
        label: buildPath(folder)
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [folders, folderMap, rootOption]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const fallbackId = defaultFolderId ?? folderOptions[0]?.id ?? "";
    setSelectedFolderId(fallbackId || "");
    setIsSubmitting(false);
    setProgress(0);
    actions.clearErrors();
  }, [actions, defaultFolderId, folderOptions, isOpen]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    actions.clearFiles();
    actions.clearErrors();
    setProgress(0);
    onClose();
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      return;
    }
    handleClose();
  };

  const handleUpload = async () => {
    if (isSubmitting) {
      return;
    }

    const filesToUpload = state.files
      .map((entry) => entry.file)
      .filter((file): file is File => file instanceof File);

    if (filesToUpload.length === 0) {
      toast({
        title: "Dodajte fajlove",
        description: "Morate odabrati makar jedan fajl pre otpremanja."
      });
      return;
    }

    if (!selectedFolderId) {
      toast({
        title: "Izaberite folder",
        description: "Molimo odaberite destinacioni folder pre otpremanja."
      });
      return;
    }

    const formData = new FormData();
    formData.append("folderId", selectedFolderId);

    if (uploadedBy) {
      formData.append("uploadedBy", uploadedBy);
    }

    filesToUpload.forEach((file) => {
      formData.append("files", file);
    });

    setIsSubmitting(true);
    setProgress(25);

    try {
      await onUpload(formData);
      setProgress(100);
      toast({
        title: "Upload uspešan",
        description:
          filesToUpload.length === 1
            ? "Fajl je uspešno otpremljen."
            : "Svi fajlovi su uspešno otpremljeni."
      });
      actions.clearFiles();
      setTimeout(() => {
        setProgress(0);
      }, 600);
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Otpremanje fajlova nije uspelo. Pokušajte ponovo.";
      toast({
        title: "Greška",
        description: message
      });
      setProgress(0);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Upload fajlova</DialogTitle>
          <DialogDescription>Dodajte nove dokumente u odabrani folder.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor={selectId}>Ciljni folder</Label>
            <Select
              value={selectedFolderId}
              onValueChange={setSelectedFolderId}
              disabled={isSubmitting || folderOptions.length === 0}>
              <SelectTrigger id={selectId} className="w-full">
                <SelectValue placeholder="Izaberite folder" />
              </SelectTrigger>
              <SelectContent>
                {folderOptions.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={cn(
              "border-border/70 bg-muted/20 hover:border-border flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition",
              state.isDragging && "border-primary bg-primary/10"
            )}
            role="button"
            tabIndex={0}
            onDragEnter={actions.handleDragEnter}
            onDragLeave={actions.handleDragLeave}
            onDragOver={actions.handleDragOver}
            onDrop={actions.handleDrop}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                actions.openFileDialog();
              }
            }}>
            <UploadCloud className="text-muted-foreground size-10" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-foreground text-sm font-medium">
                Prevucite fajlove ili odaberite sa diska
              </p>
              <p className="text-muted-foreground text-xs">
                Maksimalna veličina po fajlu {formatBytes(maxFileSizeBytes)}.
              </p>
            </div>
            <input
              {...actions.getInputProps({
                multiple: true,
                accept: "*"
              })}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={actions.openFileDialog}
              disabled={isSubmitting}>
              Odaberi fajlove
            </Button>
          </div>

          {state.errors.length > 0 ? (
            <Alert variant="destructive">
              <AlertDescription>
                {state.errors.map((error) => (
                  <p key={error}>{error}</p>
                ))}
              </AlertDescription>
            </Alert>
          ) : null}

          {state.files.length > 0 ? (
            <div className="space-y-3">
              <Label>Izabrani fajlovi</Label>
              <ScrollArea className="border-border/60 bg-background/50 max-h-48 rounded-lg border">
                <ul className="divide-border/60 divide-y">
                  {state.files.map((entry) => {
                    const file = entry.file;
                    const fileSize =
                      file instanceof File ? file.size : "size" in file ? file.size : undefined;
                    return (
                      <li key={entry.id} className="flex items-center gap-4 px-4 py-3">
                        <div className="border-border/70 bg-muted/20 text-muted-foreground flex size-10 items-center justify-center rounded-lg border">
                          <FileText className="size-4" aria-hidden="true" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground line-clamp-1 text-sm font-medium">
                            {file instanceof File ? file.name : file.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {fileSize ? formatBytes(fileSize) : "Nepoznata veličina"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => actions.removeFile(entry.id)}
                          disabled={isSubmitting}>
                          <Trash2 className="size-4" aria-hidden="true" />
                          <span className="sr-only">Ukloni fajl</span>
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            </div>
          ) : null}

          {isSubmitting ? <Progress value={progress} className="h-2" /> : null}
        </div>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Otkaži
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={isSubmitting || state.files.length === 0 || !selectedFolderId}>
            {isSubmitting ? "Otpremanje..." : "Otpremi fajlove"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
