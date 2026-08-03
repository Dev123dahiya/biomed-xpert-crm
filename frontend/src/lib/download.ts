import { api, getAccessToken } from "./api";

// Trigger a browser download for a report/export endpoint that returns a file.
export const downloadFile = async (path: string): Promise<void> => {
  const res = await api.get(path, { responseType: "blob" });
  const disposition = String(res.headers["content-disposition"] ?? "");
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? "export";
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// Present in case a raw fetch is ever needed with the current token.
export const authHeader = (): Record<string, string> => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
