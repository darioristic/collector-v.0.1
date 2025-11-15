export interface EditorMark {
	type: "bold" | "italic" | "link" | string;
	attrs?: {
		href?: string;
		[key: string]: unknown;
	};
}

export interface EditorInlineContent {
	type: "text" | "hardBreak" | string;
	text?: string;
	marks?: EditorMark[];
	[key: string]: unknown;
}

export interface EditorBlockNode {
	type: string;
	content?: EditorInlineContent[];
	[key: string]: unknown;
}

export interface EditorDoc {
	content?: EditorBlockNode[];
	type?: string;
	[key: string]: unknown;
}

