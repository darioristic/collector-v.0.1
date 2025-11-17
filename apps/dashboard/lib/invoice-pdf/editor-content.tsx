/**
 * Render Tiptap JSON content to react-pdf components
 */

import type React from "react";
import { View, Text, StyleSheet } from "@react-pdf/renderer";
import type { EditorDoc, EditorInlineContent, EditorNode } from "./types";

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

  // Generate unique keys for nodes
  const generateNodeKey = (node: EditorNode, index: number): string => {
    const contentHash = node.content
      ? node.content
          .map((c) => c.text || c.type)
          .join("")
          .slice(0, 10)
      : "";
    return `${node.type}-${index}-${contentHash}`;
  };

  const generateInlineKey = (
    inlineContent: EditorInlineContent,
    nodeIndex: number,
    inlineIndex: number
  ): string => {
    const textHash = inlineContent.text ? inlineContent.text.slice(0, 10) : "";
    return `${inlineContent.type}-${nodeIndex}-${inlineIndex}-${textHash}`;
  };

  return (
    <View>
      {doc.content.map((node: EditorNode, nodeIndex: number) => {
        if (node.type === "paragraph") {
          return (
            <View key={generateNodeKey(node, nodeIndex)} style={styles.paragraph}>
              {node.content?.map((inlineContent: EditorInlineContent, inlineIndex: number) => {
                if (inlineContent.type === "text") {
                  const text = inlineContent.text || "";
                  const textStyle: Record<string, unknown> = {
                    ...(styles.text as object)
                  };
                  return (
                    <PDFText key={generateInlineKey(inlineContent, nodeIndex, inlineIndex)} style={textStyle}>
                      {text}
                    </PDFText>
                  );
                }

                if (inlineContent.type === "hardBreak") {
                  return (
                    <Text key={generateInlineKey(inlineContent, nodeIndex, inlineIndex)}>{"\n"}</Text>
                  );
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

const PDFText = Text as unknown as React.ComponentType<{
  style?: Record<string, unknown>;
  children?: React.ReactNode;
}>;
