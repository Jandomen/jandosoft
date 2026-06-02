const TEXT_EXTENSIONS = [
  "json", "csv", "tsv", "txt", "xml", "yaml", "yml", "md", "log",
  "env", "ini", "cfg", "conf", "toml", "sql", "graphql", "html",
  "css", "js", "ts", "jsx", "tsx", "py", "rb", "php", "java", "go",
  "rs", "sh", "bash", "zsh", "bat",
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function isTextFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return TEXT_EXTENSIONS.includes(ext);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 2MB.`));
      return;
    }
    if (!isTextFile(file.name)) {
      reject(new Error(`Unsupported file type. Accepted: ${TEXT_EXTENSIONS.join(", ")}`));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function formatFileMessage(filename: string, content: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const preview = content.length > 5000 ? content.slice(0, 5000) + "\n\n... (truncated, full content has " + content.length + " chars)" : content;
  return `📎 **${filename}**\n\`\`\`${ext}\n${preview}\n\`\`\``;
}
