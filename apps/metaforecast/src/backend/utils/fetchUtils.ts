export async function fetchJson(endpoint: string): Promise<unknown> {
  const response = await fetch(endpoint);
  return response.json();
}
