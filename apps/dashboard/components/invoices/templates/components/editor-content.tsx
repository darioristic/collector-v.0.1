import { formatEditorContent } from "../format";
import type { EditorDoc } from "../types";

export function EditorContent({ content }: { content?: JSON | EditorDoc }) {
	if (!content) {
		return null;
	}

	return (
		<div className="font-mono leading-4 whitespace-pre-wrap break-words break-all">
			{formatEditorContent(content as EditorDoc)}
		</div>
	);
}
