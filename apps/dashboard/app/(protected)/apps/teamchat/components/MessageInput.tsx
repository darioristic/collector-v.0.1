"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type MessageInputProps = {
  disabled: boolean;
  isSubmitting: boolean;
  onSubmit: (payload: { content: string; file: File | null }) => Promise<void> | void;
};

export function MessageInput({ disabled, isSubmitting, onSubmit }: MessageInputProps) {
  const { toast } = useToast();
  const [value, setValue] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
      }
    };
  }, [attachmentPreview]);

  const canSubmit = useMemo(
    () => (!!value.trim() || attachment !== null) && !disabled && !isSubmitting,
    [value, attachment, disabled, isSubmitting]
  );

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    try {
      await onSubmit({
        content: value,
        file: attachment
      });
      setValue("");
      setAttachment(null);
      if (attachmentPreview) {
        URL.revokeObjectURL(attachmentPreview);
        setAttachmentPreview(null);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Slanje poruke nije uspelo. Pokušajte ponovo.";
      toast({
        title: "Greška",
        description: message,
        variant: "destructive"
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({
        title: "Fajl je prevelik",
        description: "Maksimalna veličina fajla je 15 MB.",
        variant: "destructive"
      });
      return;
    }

    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }

    const preview = URL.createObjectURL(file);
    setAttachment(file);
    setAttachmentPreview(preview);
  };

  const clearAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="border-border bg-card rounded-2xl border p-4 shadow-sm">
      {attachment ? (
        <div className="border-border bg-muted/30 mb-3 flex items-center justify-between rounded-xl border p-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
              <Paperclip className="size-5" />
            </div>
            <div className="flex flex-col text-sm">
              <span className="text-foreground font-semibold">{attachment.name}</span>
              <span className="text-muted-foreground text-xs">
                {(attachment.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={clearAttachment}>
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <div className="flex items-end gap-3">
        <Textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napišite poruku…"
          disabled={disabled}
          className="border-border bg-background min-h-[100px] flex-1 resize-none rounded-2xl border px-4 py-3"
        />
        <div className="flex flex-col gap-2">
          <Input
            type="file"
            ref={fileInputRef}
            accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isSubmitting}>
            <Paperclip className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            className="rounded-full"
            disabled={!canSubmit}
            onClick={() => void handleSubmit()}>
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
