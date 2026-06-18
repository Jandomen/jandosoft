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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_EXTS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

export function isImageFile(filename: string): boolean {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTS.includes(ext);
}

export function readImageAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error(`Imagen muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo 10MB.`));
      return;
    }
    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo no es una imagen válida."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Error al leer la imagen"));
    reader.readAsDataURL(file);
  });
}

export function getImageFromClipboard(items: DataTransferItemList): Promise<string | null> {
  return new Promise((resolve) => {
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          readImageAsBase64(file).then(resolve).catch(() => resolve(null));
          return;
        }
      }
    }
    resolve(null);
  });
}
