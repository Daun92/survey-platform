const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function api<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
    ...customHeaders as Record<string, string>,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const isAuthEndpoint = path === '/auth/login' || path === '/auth/register';
    if (res.status === 401 && !isAuthEndpoint && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return new Promise<T>(() => {});
    }
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `API Error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    // Content-Type is auto-set by browser for FormData
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Upload Error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export interface SSEEvent {
  type: 'text' | 'questions' | 'done' | 'error';
  data?: string;
}

export async function apiStream(
  path: string,
  body: unknown,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `Stream Error: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;

      try {
        const event = JSON.parse(trimmed.slice(6)) as SSEEvent;
        onEvent(event);
      } catch {
        // Skip unparseable lines
      }
    }
  }

  // Process remaining buffer
  if (buffer.trim().startsWith('data: ')) {
    try {
      const event = JSON.parse(buffer.trim().slice(6)) as SSEEvent;
      onEvent(event);
    } catch {
      // ignore
    }
  }
}
