import { z } from "zod";

// Base configuration
const ORFEO_BASE = import.meta.env.VITE_ORFEO_API_BASE_URL || 'https://orfeo.example.com';
const ORFEO_TOKEN = import.meta.env.VITE_ORFEO_API_TOKEN || 'demo-token';

async function orfeoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${ORFEO_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Token ${ORFEO_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Orfeo ${res.status} ${res.statusText}: ${body}`);
  }
  
  return res.json() as Promise<T>;
}

// Schema pour les créneaux de travail Orfeo
export const EmployeeWorkingHoursSchema = z.object({
  pk: z.number(),
  employee: z.number().nullable(),
  start_datetime: z.string().datetime().nullable(),
  end_datetime: z.string().datetime().nullable(),
  validation_status: z.enum(["planified", "pending", "validated"]),
  profession: z.number().nullable(),
  service: z.number().nullable(),
  place: z.number().nullable(),
  notes: z.string().nullable().optional(),
  planned_start_datetime: z.string().datetime().nullable().optional(),
  planned_end_datetime: z.string().datetime().nullable().optional(),
});

export type EmployeeWorkingHours = z.infer<typeof EmployeeWorkingHoursSchema>;

// Types pour les statuts UI
export type ShiftStatus = "UPCOMING" | "TO_DECLARE" | "IN_REVIEW" | "APPROVED";

export function mapStatus(row: EmployeeWorkingHours, nowISO: string): ShiftStatus {
  if (row.validation_status === "validated") return "APPROVED";
  if (row.validation_status === "pending") return "IN_REVIEW";
  
  const start = row.start_datetime ? Date.parse(row.start_datetime) : NaN;
  const now = Date.parse(nowISO);
  
  if (!Number.isNaN(start) && now >= start) return "TO_DECLARE";
  return "UPCOMING";
}

// Récupération des créneaux de travail
export async function listWorkingHours(params: {
  employeeId: number;
  overlapAfter?: string;
  overlapBefore?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("employee", String(params.employeeId));
  if (params.overlapAfter) qs.set("dates_overlap_after", params.overlapAfter);
  if (params.overlapBefore) qs.set("dates_overlap_before", params.overlapBefore);
  
  const data = await orfeoFetch<{ results?: EmployeeWorkingHours[] } | EmployeeWorkingHours[]>(
    `/api/employeeworkinghours/?${qs.toString()}`
  );
  
  const rows = Array.isArray(data) ? data : data.results ?? [];
  return rows.map((r) => EmployeeWorkingHoursSchema.parse(r));
}

// Schema pour la déclaration d'heures
export const DeclareHoursPayload = z.object({
  start_datetime: z.string().datetime(),
  end_datetime: z.string().datetime(),
  note: z.string().max(2000).optional(),
});

export type DeclareHoursPayload = z.infer<typeof DeclareHoursPayload>;

// Déclaration des heures effectives
async function setEffectiveHours(id: number, p: DeclareHoursPayload) {
  const body = { 
    start_datetime: p.start_datetime, 
    end_datetime: p.end_datetime 
  };
  
  return orfeoFetch<EmployeeWorkingHours>(
    `/api/employeeworkinghours/${id}/set_effective_hours/`,
    { method: "PATCH", body: JSON.stringify(body) }
  ).then(EmployeeWorkingHoursSchema.parse);
}

// Ajout de note si fournie
async function patchNoteIfAny(id: number, note?: string) {
  if (!note) return;
  
  await orfeoFetch<EmployeeWorkingHours>(
    `/api/employeeworkinghours/${id}/`,
    { method: "PATCH", body: JSON.stringify({ notes: note }) }
  );
}

// Fonction principale pour déclarer les heures
export async function declareHours(id: number, payload: DeclareHoursPayload) {
  const updated = await setEffectiveHours(id, payload);
  await patchNoteIfAny(id, payload.note);
  return EmployeeWorkingHoursSchema.parse(updated);
}

// Utilitaires pour les dates
export function getWeekRange(date: Date = new Date()) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay() + 1); // Lundi
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Dimanche
  end.setHours(23, 59, 59, 999);
  
  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}