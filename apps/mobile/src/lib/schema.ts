import { z } from 'zod';

export const CompanySchema = z.object({ ticker: z.string(), name: z.string(), cik: z.string() });
const ObservationSchema = z.object({
  value: z.number().finite(),
  unit: z.literal('USD'),
  start: z.string().nullable(),
  end: z.string(),
  source_ids: z.array(z.string()),
  concept: z.string(),
});
const ClaimSchema = z.object({
  text: z.string(),
  source_ids: z.array(z.string()),
  supporting_quotes: z.array(z.string()),
  assumption: z.string().nullable().optional(),
});
export const ReportSchema = z.object({
  schema_version: z.literal(1),
  id: z.string(),
  company: CompanySchema,
  retrieved_at: z.string(),
  generated_at: z.string(),
  stale: z.boolean(),
  overview: z.string().nullable(),
  overview_source_ids: z.array(z.string()),
  industry: z.string().nullable(),
  periods: z.array(
    z.object({
      kind: z.enum(['annual', 'interim_ytd']),
      label: z.string(),
      start: z.string(),
      end: z.string(),
      metrics: z.array(
        z.object({
          key: z.string(),
          label: z.string(),
          current: ObservationSchema.nullable(),
          previous: ObservationSchema.nullable(),
          change: z.number().nullable(),
          change_percent: z.number().nullable(),
          explanation: z.string(),
          missing_reason: z.string().nullable(),
        }),
      ),
    }),
  ),
  sources: z.array(
    z.object({
      id: z.string(),
      kind: z.enum(['reported_fact', 'management_statement', 'company_identity']),
      title: z.string(),
      url: z.string().url(),
      data_url: z.string().url(),
      retrieved_at: z.string(),
      excerpt: z.string(),
      accession: z.string().nullable().optional(),
      filed: z.string().nullable().optional(),
      form: z.string().nullable().optional(),
      concept: z.string().nullable().optional(),
      unit: z.string().nullable().optional(),
      value: z.number().nullable().optional(),
      start: z.string().nullable().optional(),
      end: z.string().nullable().optional(),
    }),
  ),
  uncertainties: z.array(z.string()),
  interpretation: z.object({
    status: z.enum(['disabled', 'unavailable', 'available']),
    message: z.string(),
    model: z.string().nullable().optional(),
    content: z
      .object({
        summary: z.array(ClaimSchema),
        bull: z.array(ClaimSchema),
        bear: z.array(ClaimSchema),
      })
      .nullable()
      .optional(),
  }),
});
export const SavedSchema = z.object({
  id: z.string(),
  savedAt: z.string(),
  report: ReportSchema,
  notes: z.string(),
  notesUpdatedAt: z.string().nullable(),
});
export const LibrarySchema = z.object({
  version: z.literal(1),
  watchlist: z.array(CompanySchema),
  saved: z.array(SavedSchema),
});
export type Company = z.infer<typeof CompanySchema>;
export type Report = z.infer<typeof ReportSchema>;
export type Saved = z.infer<typeof SavedSchema>;
export type Library = z.infer<typeof LibrarySchema>;
export type Evidence = Report['sources'][number];
