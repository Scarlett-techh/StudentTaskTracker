import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// client/src/lib/utils.ts

export async function apiRequest(
  method: string,
  url: string,
  data?: any,
  isFormData: boolean = false
) {
  const options: RequestInit = {
    method,
    headers: {},
    body: undefined,
  };

  if (data) {
    if (isFormData) {
      options.body = data; // FormData auto-sets headers
    } else {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Error ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}