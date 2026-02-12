const BASE_URL = '/api';

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network error' }));
    throw error;
  }
  return response.json();
}

export const api = {
  get: (path: string) => fetch(`${BASE_URL}${path}`).then(handleResponse),
  post: (path: string, body: any) => 
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(handleResponse),
  delete: (path: string, body?: any) => 
    fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined
    }).then(handleResponse),
  upload: (path: string, formData: FormData) => 
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      body: formData
    }).then(handleResponse),
  baseUrl: BASE_URL
};