import { Platform } from 'react-native';
import { z } from 'zod';
import { CompanySchema, ReportSchema } from './schema';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? 'http://127.0.0.1:8000' : '');
async function request(path: string, signal?: AbortSignal) {
  if (!API_URL)
    throw new Error(
      'The research service address is not configured. Set EXPO_PUBLIC_API_URL for this build. Saved reports are still available.',
    );
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  const timeout = setTimeout(abort, 90000); // Free hosting can take a minute to wake.
  try {
    const response = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, {
      signal: controller.signal,
    });
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error('The research service is waking up or unavailable. Try again shortly.');
    }
    if (!response.ok)
      throw new Error(
        typeof body.detail === 'string'
          ? body.detail
          : 'The research service could not complete this request.',
      );
    return body;
  } catch (error) {
    if (error instanceof TypeError || (error instanceof Error && error.name === 'AbortError'))
      throw new Error(
        'Unable to reach research. Check your connection or retry shortly. Your saved reports work offline.',
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
export async function searchCompanies(query: string, signal?: AbortSignal) {
  return z
    .object({
      companies: z.array(CompanySchema),
      stale: z.boolean(),
      retrieved_at: z.string(),
      coverage: z.string(),
    })
    .parse(await request(`/v1/companies?q=${encodeURIComponent(query)}`, signal));
}
export async function getReport(ticker: string, signal?: AbortSignal) {
  return ReportSchema.parse(await request(`/v1/reports/${encodeURIComponent(ticker)}`, signal));
}
