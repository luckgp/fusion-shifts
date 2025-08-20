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

// Données de test pour la démo
function generateTestData(params: {
  employeeId: number;
  overlapAfter?: string;
  overlapBefore?: string;
}): EmployeeWorkingHours[] {
  const now = new Date();
  const testData: EmployeeWorkingHours[] = [];
  
  // Créneau validé (lundi dernier)
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
  lastMonday.setHours(9, 0, 0, 0);
  const lastMondayEnd = new Date(lastMonday);
  lastMondayEnd.setHours(17, 0, 0, 0);
  
  testData.push({
    pk: 1,
    employee: params.employeeId,
    start_datetime: lastMonday.toISOString(),
    end_datetime: lastMondayEnd.toISOString(),
    validation_status: "validated",
    profession: 1,
    service: 2,
    place: 1,
    notes: "Journée complète de formation",
    planned_start_datetime: lastMonday.toISOString(),
    planned_end_datetime: lastMondayEnd.toISOString(),
  });

  // Créneau en validation (hier)
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(18, 0, 0, 0);
  
  testData.push({
    pk: 2,
    employee: params.employeeId,
    start_datetime: yesterday.toISOString(),
    end_datetime: yesterdayEnd.toISOString(),
    validation_status: "pending",
    profession: 2,
    service: 1,
    place: 2,
    notes: "Réunion client prolongée",
    planned_start_datetime: yesterday.toISOString(),
    planned_end_datetime: yesterdayEnd.toISOString(),
  });

  // Créneau à déclarer (ce matin)
  const thisMonring = new Date(now);
  thisMonring.setHours(8, 30, 0, 0);
  const thisMorningEnd = new Date(thisMonring);
  thisMorningEnd.setHours(12, 30, 0, 0);
  
  testData.push({
    pk: 3,
    employee: params.employeeId,
    start_datetime: thisMonring.toISOString(),
    end_datetime: thisMorningEnd.toISOString(),
    validation_status: "planified",
    profession: 1,
    service: 1,
    place: 1,
    notes: null,
    planned_start_datetime: thisMonring.toISOString(),
    planned_end_datetime: thisMorningEnd.toISOString(),
  });

  // Créneau à venir (demain)
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(17, 0, 0, 0);
  
  testData.push({
    pk: 4,
    employee: params.employeeId,
    start_datetime: tomorrow.toISOString(),
    end_datetime: tomorrowEnd.toISOString(),
    validation_status: "planified",
    profession: 3,
    service: 2,
    place: 3,
    notes: null,
    planned_start_datetime: tomorrow.toISOString(),
    planned_end_datetime: tomorrowEnd.toISOString(),
  });

  // Autre créneau à venir (vendredi)
  const friday = new Date(now);
  friday.setDate(now.getDate() + ((5 - now.getDay() + 7) % 7));
  friday.setHours(13, 0, 0, 0);
  const fridayEnd = new Date(friday);
  fridayEnd.setHours(16, 0, 0, 0);
  
  testData.push({
    pk: 5,
    employee: params.employeeId,
    start_datetime: friday.toISOString(),
    end_datetime: fridayEnd.toISOString(),
    validation_status: "planified",
    profession: 2,
    service: 3,
    place: 1,
    notes: null,
    planned_start_datetime: friday.toISOString(),
    planned_end_datetime: fridayEnd.toISOString(),
  });

  return testData;
}

// Récupération des créneaux de travail
export async function listWorkingHours(params: {
  employeeId: number;
  overlapAfter?: string;
  overlapBefore?: string;
}) {
  // En mode démo, retourner les données de test
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    const testData = generateTestData(params);
    return testData.map((r) => EmployeeWorkingHoursSchema.parse(r));
  }

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
  // En mode démo, simuler la déclaration
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    // Simuler un délai d'API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retourner le créneau avec le statut mis à jour
    return {
      pk: id,
      employee: 1,
      start_datetime: payload.start_datetime,
      end_datetime: payload.end_datetime,
      validation_status: "pending" as const,
      profession: 1,
      service: 1,
      place: 1,
      notes: payload.note || null,
      planned_start_datetime: payload.start_datetime,
      planned_end_datetime: payload.end_datetime,
    };
  }

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