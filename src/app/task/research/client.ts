export async function request<T>(url: string, body?: unknown, key?: string): Promise<T> {
  const response = await fetch(url, { method: body === undefined ? "GET" : "POST", headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(key ? { Authorization: `Bearer ${key}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? `Request failed (${response.status}).`);
  return data as T;
}
export function download(name: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
}
