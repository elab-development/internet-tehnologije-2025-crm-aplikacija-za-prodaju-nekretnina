export const API_BASE = "http://localhost:8000";

export function toImageUrl(putanja) {
  if (!putanja) return "";
  if (putanja.startsWith("http")) return putanja; 
  return `${API_BASE}/storage/${putanja}`;
}