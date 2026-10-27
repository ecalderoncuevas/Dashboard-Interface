"use client"

import {
  CheckCircle2Icon,
  CloudDownloadIcon,
  UploadCloudIcon,
  XCircleIcon,
} from "lucide-react"

import type { PipelineEtl } from "@/hooks/use-pipeline-etl"

import { formatoEntero, formatoPorcentaje } from "./formato"

interface Kpi {
  titulo: string
  valor: number | null
  ayuda: string
  icono: typeof CheckCircle2Icon
  porcentaje?: string
}

export function TarjetasKpi({ etl }: { etl: PipelineEtl }) {
  const { procesado, filtradosOrdenados, conjuntoCarga, extraccion } = etl
  const total = procesado?.transformacion.registros.length ?? 0
  const validos = procesado?.limpieza.validos.length ?? 0
  const rechazados = procesado?.limpieza.rechazados.length ?? 0
  const ciudades = extraccion?.descargas.filter((d) => d.estado === "ok").length

  const kpis: Kpi[] = [
    {
      titulo: "Registros extraídos",
      valor: procesado ? total : null,
      ayuda: procesado
        ? `Una fila por ciudad y hora · ${ciudades} ciudades`
        : "Una fila por ciudad y hora",
      icono: CloudDownloadIcon,
    },
    {
      titulo: "Válidos",
      valor: procesado ? validos : null,
      ayuda: "Superan las reglas de calidad",
      icono: CheckCircle2Icon,
      porcentaje: procesado ? formatoPorcentaje(validos, total) : undefined,
    },
    {
      titulo: "Rechazados",
      valor: procesado ? rechazados : null,
      ayuda: "Descartes por calidad o duplicado",
      icono: XCircleIcon,
      porcentaje: procesado ? formatoPorcentaje(rechazados, total) : undefined,
    },
    {
      titulo: "Listos para cargar",
      valor: procesado ? conjuntoCarga.registros.length : null,
      ayuda: procesado
        ? `${formatoEntero(filtradosOrdenados.length)} coinciden con los filtros`
        : "Seleccionados y dentro de los filtros",
      icono: UploadCloudIcon,
    },
  ]

  return (
    <section
      aria-label="Indicadores principales"
      className="flex flex-col gap-2"
    >
      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {kpis.map(({ titulo, valor, ayuda, icono: Icono, porcentaje }) => (
          <div
            key={titulo}
            className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <span
              aria-hidden
              className="flex size-10 items-center justify-center rounded-xl ring-1 ring-foreground/10"
            >
              <Icono className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <dt className="order-2 text-sm text-muted-foreground">
                {titulo}
              </dt>
              <dd className="order-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                  {valor === null ? "—" : formatoEntero(valor)}
                </span>
                {porcentaje && (
                  <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium tabular-nums">
                    {porcentaje}
                  </span>
                )}
              </dd>
              <dd className="order-3 text-xs text-muted-foreground">{ayuda}</dd>
            </div>
          </div>
        ))}
      </dl>
      {conjuntoCarga.seleccionadosFueraDeFiltro > 0 && (
        <p className="text-sm text-amber-800 dark:text-amber-300" role="status">
          ⚠ {formatoEntero(conjuntoCarga.seleccionadosFueraDeFiltro)} fila(s)
          seleccionada(s) quedan fuera de los filtros actuales y no se subirán.
        </p>
      )}
    </section>
  )
}
