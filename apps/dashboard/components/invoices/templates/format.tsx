import * as React from "react";
import type { EditorDoc, EditorMark } from "./types";

export function formatEditorContent(doc?: EditorDoc): React.JSX.Element | null {
	if (!doc || !doc.content) {
		return null;
	}

	return (
		<>
			{doc.content.map((node, nodeIndex) => {
				if (node.type === "paragraph") {
					// Split text by newlines and create separate text nodes
					const processText = (
						text: string,
						marks?: EditorMark[],
					): React.ReactNode[] => {
						const lines = text.split("\n");
						const result: React.ReactNode[] = [];

						lines.forEach((line, lineIndex) => {
							if (lineIndex > 0) {
								result.push(<br key={`br-${nodeIndex}-${lineIndex}`} />);
							}

							if (line) {
								let style = "text-[11px] break-words break-all";
								let href: string | undefined;

								if (marks) {
									for (const mark of marks) {
										if (mark.type === "bold") {
											style += " font-medium";
										} else if (mark.type === "italic") {
											style += " italic";
										} else if (mark.type === "link") {
											href = mark.attrs?.href as string | undefined;
											style += " underline";
										}
									}
								}

								const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line);

								if (href || isEmail) {
									const linkHref = href || (isEmail ? `mailto:${line}` : line);
									result.push(
										<a
											key={`link-${nodeIndex}-${lineIndex}`}
											href={linkHref}
											className={`${style} underline`}
										>
											{line}
										</a>,
									);
								} else {
									result.push(
										<span
											key={`text-${nodeIndex}-${lineIndex}`}
											className={style}
										>
											{line}
										</span>,
									);
								}
							}
						});

						return result;
					};

					return (
						<p key={`paragraph-${nodeIndex.toString()}`} className="mb-1">
							{node.content?.map((inlineContent, inlineIndex) => {
								if (inlineContent.type === "text") {
									return (
										<React.Fragment
											key={`fragment-${nodeIndex}-${inlineIndex}`}
										>
											{processText(
												inlineContent.text || "",
												inlineContent.marks,
											)}
										</React.Fragment>
									);
								}

								if (inlineContent.type === "hardBreak") {
									return (
										<br key={`break-${nodeIndex}-${inlineIndex.toString()}`} />
									);
								}

								return null;
							})}
						</p>
					);
				}

				return null;
			})}
		</>
	);
}
