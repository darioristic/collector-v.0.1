"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor as TipTapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";

export interface EditorProps {
  initialContent?: any;
  onChange?: (content: any) => void;
  className?: string;
  placeholder?: string;
  editable?: boolean;
}

export function Editor({
  initialContent,
  onChange,
  className,
  placeholder,
  editable = true,
}: EditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm focus:outline-none min-h-[80px] max-w-none",
          className
        ),
      },
    },
  });

  React.useEffect(() => {
    if (editor && initialContent && editor.getJSON() !== initialContent) {
      editor.commands.setContent(initialContent);
    }
  }, [editor, initialContent]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("rounded-md border border-input p-3", className)}>
      <EditorContent editor={editor} />
    </div>
  );
}
