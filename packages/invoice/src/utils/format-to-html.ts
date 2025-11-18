/**
 * Formats TipTap editor content to HTML
 * @param content - The editor JSON content
 * @returns HTML string
 */
export function formatEditorContent(content: any): string {
  if (!content) return "";

  // If it's already a string, return it
  if (typeof content === "string") return content;

  // Simple conversion from TipTap JSON to HTML
  // This is a basic implementation - you may need to enhance it
  // based on your specific editor extensions

  const nodeToHtml = (node: any): string => {
    if (node.type === "text") {
      let text = node.text || "";
      if (node.marks) {
        node.marks.forEach((mark: any) => {
          if (mark.type === "bold") text = `<strong>${text}</strong>`;
          if (mark.type === "italic") text = `<em>${text}</em>`;
          if (mark.type === "code") text = `<code>${text}</code>`;
        });
      }
      return text;
    }

    const content = node.content?.map(nodeToHtml).join("") || "";

    switch (node.type) {
      case "paragraph":
        return `<p>${content}</p>`;
      case "heading":
        return `<h${node.attrs?.level || 1}>${content}</h${node.attrs?.level || 1}>`;
      case "bulletList":
        return `<ul>${content}</ul>`;
      case "orderedList":
        return `<ol>${content}</ol>`;
      case "listItem":
        return `<li>${content}</li>`;
      case "codeBlock":
        return `<pre><code>${content}</code></pre>`;
      case "blockquote":
        return `<blockquote>${content}</blockquote>`;
      case "hardBreak":
        return "<br>";
      default:
        return content;
    }
  };

  if (content.content) {
    return content.content.map(nodeToHtml).join("");
  }

  return "";
}
