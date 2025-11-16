/**
 * Render Tiptap JSON content to react-pdf components
 */

import React from "react";
import { View, Text, StyleSheet, Link } from "@react-pdf/renderer";
import type { EditorDoc, EditorNode, EditorInlineContent, EditorMark } from "./types";

const styles = StyleSheet.create({
  paragraph: {
    marginBottom: 4,
    fontFamily: "Courier",
    fontSize: 11,
    lineHeight: 1.4
  },
  text: {
    fontFamily: "Courier",
    fontSize: 11
  },
  bold: {
    fontWeight: "bold"
  },
  italic: {
    fontStyle: "italic"
  },
  link: {
    color: "#0066cc",
    textDecoration: "underline"
  }
});

interface EditorContentProps {
  content?: EditorDoc;
}

export function EditorContent({ content }: EditorContentProps) {
  if (!content || typeof content !== "object") {
    return null;
  }

  const doc = content as EditorDoc;

  if (!doc.content || !Array.isArray(doc.content)) {
    return null;
  }

  return (
    <View>
      {doc.content.map((node: EditorNode, nodeIndex: number) => {
        if (node.type === "paragraph") {
          return (
            <View key={`paragraph-${nodeIndex}`} style={styles.paragraph}>
              {node.content?.map((inlineContent: EditorInlineContent, inlineIndex: number) => {
                if (inlineContent.type === "text") {
                  const text = inlineContent.text || "";
                  const marks = inlineContent.marks || [];

                  const textStyle: Record<string, unknown> = {
                    ...(styles.text as object),
                    ...(marks.some((m: EditorMark) => m.type === "bold") ? (styles.bold as object) : {}),
                    ...(marks.some((m: EditorMark) => m.type === "italic") ? (styles.italic as object) : {})
                  };

                  // Check if it's a link
                  const linkMark = marks.find((m: EditorMark) => m.type === "link");
                  const href = linkMark?.attrs?.href as string | undefined;

                  // Check if text looks like an email
                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);

                  if (href || isEmail) {
                    const linkHref = href || (isEmail ? `mailto:${text}` : text);
                    const linkStyle: Record<string, unknown> = {
                      ...(textStyle as object),
                      ...(styles.link as object)
                    };
                    return (
                      <Link
                        key={`link-${nodeIndex}-${inlineIndex}`}
                        src={linkHref}
                        style={linkStyle as any}
                      >
                        {text}
                      </Link>
                    );
                  }

                  return (
                    <Text key={`text-${nodeIndex}-${inlineIndex}`} style={textStyle as any}>
                      {text}
                    </Text>
                  );
                }

                if (inlineContent.type === "hardBreak") {
                  return <Text key={`break-${nodeIndex}-${inlineIndex}`}>{"\n"}</Text>;
                }

                return null;
              })}
            </View>
          );
        }

        return null;
      })}
    </View>
  );
}
