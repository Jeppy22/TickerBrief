import { Platform } from 'react-native';
import { z } from 'zod';
import { CompanySchema, ReportSchema } from './schema';

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'web' ? 'http://127.0.0.1:8000' : '');
async function request(path: string, signal?: AbortSignal) {
  if (!API_URL)
    throw new Error(
      'This build is not connected to a research service. Your saved reports are still available. Please contact the beta operator.',
    );
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  if (signal?.aborted) abort();
  const timeout = setTimeout(() => {
    timedOut = true;
    abort();
  }, 90000); // Free hosting can take a minute to wake.
  try {
    const response = await fetch(`${API_URL.replace(/\/$/, '')}${path}`, {
      signal: controller.signal,
    });
    let body;
    try {
      body = await response.json();
    } catch (error) {
      if (controller.signal.aborted) throw error;
      throw new Error('The research service is waking up or unavailable. Try again shortly.');
    }
    if (!response.ok)
      throw new Error(
        typeof body.detail === 'string' && body.detail.trim()
          ? body.detail
          : 'The research service could not complete this request.',
      );
    return body;
  } catch (error) {
    if (timedOut)
      throw new Error(
        'The research request timed out. Please retry shortly. Your saved reports are still available offline.',
      );
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
  const result = z
    .object({
      companies: z.array(CompanySchema),
      stale: z.boolean(),
      retrieved_at: z.string(),
      coverage: z.string(),
    })
    .safeParse(await request(`/v1/companies?q=${encodeURIComponent(query)}`, signal));
  if (!result.success)
    throw new Error('The company search response could not be verified. Please retry shortly.');
  return result.data;
}
export async function getReport(ticker: string, signal?: AbortSignal) {
  const result = ReportSchema.safeParse(
    await request(`/v1/reports/${encodeURIComponent(ticker)}`, signal),
  );
  if (!result.success)
    throw new Error(
      'This research response could not be verified. No report was saved. Please retry shortly.',
    );
  return result.data;
}
