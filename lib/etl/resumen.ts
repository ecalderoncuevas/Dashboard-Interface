import type { RegistroRechazado, RegistroValido } from "./tipos"

export type Metrica = "temperatura" | "humedad" | "precipitacion"

export const METRICAS: Record<
  Metrica,
  { titulo: string; unidad: string; agregado: "media" | "suma" }
> = {
  temperatura: { titulo: "Temperatura media", unidad: "°C", agregado: "media" },
  humedad: { titulo: "Humedad media", unidad: "%", agregado: "media" },
  precipitacion: {
    titulo: "Precipitación total",
    unidad: "mm",
    agregado: "suma",
  },
}

const CAMPOS = {
  temperatura: "temperatura_c",
  humedad: "humedad_pct",
  precipitacion: "precipitacion_mm",
} as const

export interface ResumenCiudad {
  ciudad: string
  valor: number
  registros: number
}

export interface ResumenMetrica {
  ciudades: ResumenCiudad[]
  /** Media de todas las horas o suma total, según la métrica. */
  global: number
}

/** Agrega los registros válidos por ciudad, en el orden en que aparecen. */
export function resumirPorCiudad(
  validos: readonly RegistroValido[],
  metrica: Metrica
): ResumenMetrica {
  const campo = CAMPOS[metrica]
  const media = METRICAS[metrica].agregado === "media"
  const acumulado = new Map<string, { suma: number; registros: number }>()
  let suma = 0
  for (const r of validos) {
    const a = acumulado.get(r.ciudad) ?? { suma: 0, registros: 0 }
    a.suma += r[campo]
    a.registros++
    acumulado.set(r.ciudad, a)
    suma += r[campo]
  }
  const ciudades = [...acumulado].map(([ciudad, a]) => ({
    ciudad,
    registros: a.registros,
    valor: media ? a.suma / a.registros : a.suma,
  }))
  const global = media ? (validos.length ? suma / validos.length : 0) : suma
  return { ciudades, global }
}

export interface Escala {
  min: number
  max: number
  marcas: number[]
}

/** Eje con valores "redondos" que incluye siempre el cero. */
export function escalaEje(valores: readonly number[], divisiones = 4): Escala {
  const bajo = Math.min(0, ...valores)
  const alto = Math.max(0, ...valores)
  if (bajo === alto) return { min: 0, max: 1, marcas: [0, 1] }

  const bruto = (alto - bajo) / divisiones
  const magnitud = 10 ** Math.floor(Math.log10(bruto))
  const paso = [1, 2, 2.5, 5, 10].find((m) => m * magnitud >= bruto)! * magnitud
  const min = Math.floor(bajo / paso) * paso
  const max = Math.ceil(alto / paso) * paso
  const marcas: number[] = []
  // Redondeo para evitar acumulaciones del tipo 0.30000000000000004.
  for (let v = min; v <= max + paso / 2; v += paso) {
    marcas.push(Number(v.toPrecision(12)))
  }
  return { min, max, marcas }
}

/** Quita los valores concretos para agrupar motivos del mismo tipo. */
function normalizarMotivo(motivo: string) {
  return motivo
    .split(":")[0]
    .replace(/\s*\(.*\)$/, "")
    .trim()
}

/** Motivos de rechazo más frecuentes (una fila puede aportar varios). */
export function motivosFrecuentes(
  rechazados: readonly RegistroRechazado[],
  limite = 3
): { motivo: string; total: number }[] {
  const conteo = new Map<string, number>()
  for (const r of rechazados) {
    for (const m of r.motivos) {
      const motivo = normalizarMotivo(m)
      conteo.set(motivo, (conteo.get(motivo) ?? 0) + 1)
    }
  }
  return [...conteo]
    .map(([motivo, total]) => ({ motivo, total }))
    .sort((a, b) => b.total - a.total || a.motivo.localeCompare(b.motivo))
    .slice(0, limite)
}
