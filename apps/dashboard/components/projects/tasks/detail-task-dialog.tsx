"use client";

import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { AlignLeft, AtSign, MessageSquare, MoreVertical, Plus, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LinkEditPopover } from "@/components/ui/custom/minimal-tiptap/components/link/link-edit-popover";
import { SectionFour } from "@/components/ui/custom/minimal-tiptap/components/section/four";
import { SectionOne } from "@/components/ui/custom/minimal-tiptap/components/section/one";
import { SectionTwo } from "@/components/ui/custom/minimal-tiptap/components/section/two";
import { ToolbarButton } from "@/components/ui/custom/minimal-tiptap/components/toolbar-button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface AssignedPerson {
  id: string;
  name: string;
  avatar?: string;
}

interface DetailTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    priority: string;
    assignedTo: AssignedPerson[];
    description: string;
    reminder: boolean;
  }) => void;
  initialData?: {
    title?: string;
    priority?: string;
    assignedTo?: AssignedPerson[];
    description?: string;
    reminder?: boolean;
  };
}

const CustomToolbar = ({ editor }: { editor: Editor }) => {
  return (
    <div className="border-border bg-muted/30 flex items-center gap-0.5 border-b px-2 py-1.5">
      <SectionOne editor={editor} />
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="hover:bg-accent flex h-7 items-center gap-1 rounded px-2 py-1 text-sm">
            14px
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>12px</DropdownMenuItem>
          <DropdownMenuItem>14px</DropdownMenuItem>
          <DropdownMenuItem>16px</DropdownMenuItem>
          <DropdownMenuItem>18px</DropdownMenuItem>
          <DropdownMenuItem>20px</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <SectionTwo
        editor={editor}
        activeActions={["bold", "italic", "underline", "strikethrough"]}
        mainActionCount={4}
      />
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton tooltip="Alignment" aria-label="Alignment" size="sm">
            <AlignLeft className="size-4" />
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => {}}>Left</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>Center</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>Right</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {}}>Justify</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <SectionFour
        editor={editor}
        activeActions={["orderedList", "bulletList"]}
        mainActionCount={0}
      />
      <Separator orientation="vertical" className="mx-0.5 h-5" />
      <ToolbarButton tooltip="Comment" aria-label="Comment" size="sm">
        <MessageSquare className="size-4" />
      </ToolbarButton>
      <LinkEditPopover editor={editor} size="sm" />
      <ToolbarButton tooltip="Mention" aria-label="Mention" size="sm">
        <AtSign className="size-4" />
      </ToolbarButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ToolbarButton tooltip="More options" aria-label="More options" size="sm">
            <MoreVertical className="size-4" />
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>More options</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export function DetailTaskDialog({ isOpen, onClose, onSave, initialData }: DetailTaskDialogProps) {
  const titleId = useId();
  const priorityId = useId();
  const reminderId = useId();
  const [title, setTitle] = useState(initialData?.title || "Edit Design System");
  const [priority, setPriority] = useState(initialData?.priority || "high");
  const [assignedTo, setAssignedTo] = useState<AssignedPerson[]>(
    initialData?.assignedTo || [
      { id: "1", name: "Sophia Williams" },
      { id: "2", name: "Liam Johnson" },
      { id: "3", name: "Olivia Smith" }
    ]
  );
  const [reminder, setReminder] = useState(initialData?.reminder || false);
  const [description, setDescription] = useState(
    initialData?.description ||
      "The goal is to update the current design system with the latest components and styles. This includes reviewing existing elements, identifying areas for improvement, and implementing changes to ensure consistency and usability across all platforms."
  );

  const editor = useEditor({
    extensions: [StarterKit, Underline, Link],
    content: description || "",
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML());
    }
  });

  const handleRemovePerson = (id: string) => {
    setAssignedTo(assignedTo.filter((p) => p.id !== id));
  };

  const handleSave = () => {
    onSave({
      title,
      priority,
      assignedTo,
      description,
      reminder
    });
    onClose();
  };

  const handleReset = () => {
    setTitle(initialData?.title || "");
    setPriority(initialData?.priority || "high");
    setAssignedTo(initialData?.assignedTo || []);
    setReminder(initialData?.reminder || false);
    setDescription(initialData?.description || "");
    if (editor) {
      editor.commands.setContent(initialData?.description || "");
    }
  };

  useEffect(() => {
    if (editor && initialData?.description) {
      editor.commands.setContent(initialData.description);
    }
  }, [editor, initialData?.description]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] w-[90vw] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b px-6 pt-6 pb-4">
          <div>
            <h2 className="mb-1.5 text-2xl leading-tight font-bold">Detail Task</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Manage your task detail here.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ring-offset-background focus:ring-ring mt-1 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Title and Priority Row */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor={titleId} className="text-sm leading-none font-medium">
                Title Task
              </Label>
              <Input
                id={titleId}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Edit Design System"
                className="h-10 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={priorityId} className="text-sm leading-none font-medium">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger
                  id={priorityId}
                  className={cn(
                    "h-10 text-sm",
                    priority === "high" &&
                      "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
                  )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assign Task To */}
          <div className="space-y-2.5">
            <Label className="text-sm leading-none font-medium">Assign Task To</Label>
            <div className="space-y-3">
              {assignedTo.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {assignedTo.map((person) => (
                    <div
                      key={person.id}
                      className="bg-muted flex items-center gap-2 rounded-md px-3 py-1.5">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={person.avatar} alt={person.name} />
                        <AvatarFallback className="text-xs">
                          {person.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm leading-none">{person.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePerson(person.id)}
                        className="ml-0.5 transition-opacity hover:opacity-70">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full justify-center gap-2 text-sm"
                onClick={() => {
                  // Mock add person - in real app this would open a dialog
                  const newPerson: AssignedPerson = {
                    id: Date.now().toString(),
                    name: "New Person"
                  };
                  setAssignedTo([...assignedTo, newPerson]);
                }}>
                <Plus className="h-4 w-4" />
                Add other person
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm leading-none font-medium">Description</Label>
            <div className="border-input focus-within:border-primary overflow-hidden rounded-md border shadow-xs">
              {editor && <CustomToolbar editor={editor} />}
              <div className="prose prose-sm max-h-[300px] min-h-[200px] max-w-none overflow-y-auto p-4">
                {editor && <EditorContent editor={editor} />}
              </div>
              <div className="bg-muted/30 flex items-center justify-between border-t px-4 py-2">
                <span className="text-muted-foreground text-xs leading-none">
                  {description.replace(/<[^>]*>/g, "").length}/200
                </span>
                <div className="h-4 w-4 cursor-nwse-resize opacity-50" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 flex shrink-0 items-center justify-between border-t px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Switch id={reminderId} checked={reminder} onCheckedChange={setReminder} />
            <Label htmlFor={reminderId} className="cursor-pointer text-sm leading-none font-normal">
              Reminder Task
            </Label>
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" onClick={handleReset} className="h-9 px-4 text-sm">
              Reset
            </Button>
            <Button
              onClick={handleSave}
              className="bg-foreground text-background hover:bg-foreground/90 h-9 px-4 text-sm">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
