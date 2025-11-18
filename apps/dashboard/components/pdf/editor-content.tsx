import { View } from "@react-pdf/renderer";
import type { EditorDoc } from "@/types/editor";
import { formatEditorContent } from "./format";

export function EditorContent({ content }: { content?: EditorDoc }) {
	if (!content) {
		return null;
	}

	return <View style={{ marginTop: 10 }}>{formatEditorContent(content)}</View>;
}
