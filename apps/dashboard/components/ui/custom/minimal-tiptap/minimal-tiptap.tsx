import * as React from "react";
import "./styles/index.css";

import type { Content, Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { LinkBubbleMenu } from "./components/bubble-menu/link-bubble-menu";
import { MeasuredContainer } from "./components/measured-container";
import { SectionFour } from "./components/section/four";
import { SectionTwo } from "./components/section/two";
import type { UseMinimalTiptapEditorProps } from "./hooks/use-minimal-tiptap";
import { useMinimalTiptapEditor } from "./hooks/use-minimal-tiptap";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import { ToolbarButton } from "./components/toolbar-button";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface MinimalTiptapProps
	extends Omit<UseMinimalTiptapEditorProps, "onUpdate"> {
	value?: Content;
	onChange?: (value: Content) => void;
	className?: string;
	editorContentClassName?: string;
	hideToolbar?: boolean;
	unstyled?: boolean;
}

const Toolbar = ({ editor }: { editor: Editor }) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [instructions, setInstructions] = React.useState("");

    const runAI = React.useCallback(async (action: "summarize" | "improve" | "rewrite" | "extractTasks", customInstructions?: string) => {
        try {
            setIsLoading(true);
            const text = editor.getText();
            const res = await fetch("/api/editor/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, text, instructions: customInstructions }),
            });
            if (!res.ok) return;
            const data = await res.json();
            editor.commands.setContent(String(data.result || ""));
        } finally {
            setIsLoading(false);
        }
    }, [editor]);

    return (
        <div className="shrink-0 overflow-x-auto border-b border-border p-2">
            <div className="flex w-max items-center gap-px">
                <SectionTwo
                    editor={editor}
                    activeActions={[
                        "bold",
                        "italic",
                        "underline",
                        "strikethrough",
                        "code",
                        "clearFormatting",
                    ]}
                    mainActionCount={3}
                />

                <Separator orientation="vertical" className="mx-2 h-7" />

                <SectionFour
                    editor={editor}
                    activeActions={["orderedList", "bulletList"]}
                    mainActionCount={0}
                />

                <Separator orientation="vertical" className="mx-2 h-7" />

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <ToolbarButton tooltip={isLoading ? "Generating..." : "AI actions"} aria-label="AI actions" disabled={isLoading}>
                            <Sparkles className="size-5" />
                        </ToolbarButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-64">
                        <DropdownMenuItem onClick={() => runAI("summarize")}>Summarize</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => runAI("improve")}>Improve writing</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => runAI("rewrite")}>Rewrite</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => runAI("extractTasks")}>Extract tasks</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>CRM presets</DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => runAI("improve", "Format as concise client notes with bullet points for action items, decisions, and follow-ups.")}>Client notes</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => runAI("improve", "Produce a clear task description including objectives, acceptance criteria, and dependencies.")}>Task description</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => runAI("improve", "Summarize customer profile including background, preferences, recent interactions, and next steps.")}>Customer profile</DropdownMenuItem>
                            </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Instructions</DropdownMenuLabel>
                        <div className="p-2">
                            <Input
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Add guidance (optional)"
                                className="h-8"
                            />
                            <div className="mt-2">
                                <DropdownMenuItem onClick={() => runAI("improve", instructions)} disabled={isLoading || !editor.getText()}>Apply with instructions</DropdownMenuItem>
                            </div>
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
};

export const MinimalTiptapEditor = React.forwardRef<
	HTMLDivElement,
	MinimalTiptapProps
>(({ value, onChange, className, editorContentClassName, hideToolbar, unstyled, ...props }, ref) => {
	const editor = useMinimalTiptapEditor({
		value,
		onUpdate: onChange,
		immediatelyRender: false,
		...props,
	});

	if (!editor) {
		return null;
	}

	return (
		<MeasuredContainer
			as="div"
			name="editor"
			ref={ref}
			className={cn(
				unstyled
					? "flex h-auto min-h-0 w-full flex-col"
					: "flex h-auto min-h-72 w-full flex-col rounded-md border border-input shadow-xs focus-within:border-primary",
				className,
			)}
		>
			{!hideToolbar && <Toolbar editor={editor} />}
			<EditorContent
				editor={editor}
				className={cn("minimal-tiptap-editor", editorContentClassName)}
			/>
			<LinkBubbleMenu editor={editor} />
		</MeasuredContainer>
	);
});

MinimalTiptapEditor.displayName = "MinimalTiptapEditor";

export default MinimalTiptapEditor;
