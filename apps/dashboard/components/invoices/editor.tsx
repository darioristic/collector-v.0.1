"use client";

import { cn } from "@/lib/utils";
import { Editor as BaseEditor } from "@/components/ui/editor";
import type { Editor as EditorInstance, JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useState } from "react";

type Props = {
  initialContent?: JSONContent;
  className?: string;
  onChange?: (content?: JSONContent) => void;
  onBlur?: (content: JSONContent | null) => void;
  placeholder?: string;
};

export function Editor({
  initialContent,
  className,
  onChange,
  onBlur,
  placeholder,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [content, setContent] = useState<JSONContent | undefined>(
    initialContent,
  );

  const handleUpdate = useCallback(
    (editor: EditorInstance) => {
      const json = editor.getJSON();
      const newIsEmpty = editor.state.doc.textContent.length === 0;

      setIsEmpty(newIsEmpty);
      setContent(newIsEmpty ? null : json);
      onChange?.(newIsEmpty ? null : json);
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);

    // Only call onBlur if the content has changed
    if (content !== initialContent) {
      onBlur?.(content ?? null);
    }
    onBlur?.(content ?? null);
  }, [content, onBlur]);

  useEffect(() => {
    if (!content?.content?.length) {
      setIsEmpty(true);
    }
  }, [content]);

  const showPlaceholder = isEmpty && !isFocused;

  return (
    <BaseEditor
      className={cn(
        "font-mono text-[11px] text-primary leading-[18px] invoice-editor",
        showPlaceholder && "w-full dotted-bg",
        className,
      )}
      placeholder={placeholder}
      initialContent={content}
      onUpdate={handleUpdate}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
    />
  );
}
