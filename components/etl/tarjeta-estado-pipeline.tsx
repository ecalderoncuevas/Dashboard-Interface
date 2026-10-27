"use client"

import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PipelineEtl } from "@/hooks/use-pipeline-etl"
import type { EstadoFase } from "@/lib/etl/tipos"
import { cn } from "@/lib/utils"

import { EstadoBadge } from "./estado-badge"
import type { Destino } from "./aplicacion-etl"
import { calcularFases, type Fase } from "./pipeline-visual"

/** Qué tiene que hacer el estudiante a continuación, según la fase actual. */
function siguientePaso(fase: Fase | undefined): string {
  if (!fase)
    return "Pipeline completo. Consulta los datos guardados en Supabase."
  const pasos: Record<string, Partial<Record<EstadoFase, string>>> = {
    extraccion: {
      pendiente: "Elige ciudades y fechas y pulsa «Extraer datos».",
      en_curso: "Descargando los datos de Open-Meteo…",
      error: "Alguna ciudad ha fallado: reinténtala desde la extracción.",
    },
    transformacion: {
      error: "Hay arrays incoherentes: revisa los registros transformados.",
    },
    filtrado: {
      en_curso: "Selecciona los registros que quieres cargar.",
      error: "Hay filtros no válidos: corrígelos.",
    },
    carga: {
      pendiente: "Revisa la vista previa y carga los datos en Supabase.",
      en_curso: "Subiendo lotes a Supabase…",
      error: "Hay lotes con errores o claves sin verificar: reinténtalos.",
    },
  }
  return pasos[fase.id]?.[fase.estado] ?? `Revisa la fase de ${fase.titulo}.`
}

export function TarjetaEstadoPipeline({
  etl,
  navegar,
}: {
  etl: PipelineEtl
  navegar: (destino: Destino) => void
}) {
  const fases = calcularFases(etl)
  const completadas = fases.filter((f) => f.estado === "completada").length
  const actual = fases.find((f) => f.estado !== "completada")
  const estadoGeneral: EstadoFase = !actual
    ? "completada"
    : fases.some((f) => f.estado === "error")
      ? "error"
      : fases.some((f) => f.estado === "en_curso")
        ? "en_curso"
        : completadas > 0
          ? "en_curso"
          : "pendiente"

  return (
    <section
      aria-labelledby="titulo-estado-pipeline"
      className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="titulo-estado-pipeline" className="text-base font-medium">
            Estado del pipeline
          </h2>
          <EstadoBadge
            estado={estadoGeneral}
            texto={
              estadoGeneral === "en_curso" &&
              !fases.some((f) => f.estado === "en_curso")
                ? "En progreso"
                : undefined
            }
            className="self-start"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Ver el pipeline completo"
          onClick={() => navegar("pipeline")}
        >
          <ArrowUpRightIcon aria-hidden />
        </Button>
      </header>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-sm">
          <span>
            {completadas} de {fases.length} fases completadas
          </span>
          <span className="text-muted-foreground tabular-nums">
            {Math.round((completadas / fases.length) * 100)} %
          </span>
        </div>
        <div aria-hidden className="grid grid-cols-5 gap-1">
          {fases.map((f) => (
            <span
              key={f.id}
              className={cn(
                "block h-2.5 rounded-full",
                f.estado === "completada" && "bg-primary",
                f.estado === "en_curso" && "animate-pulse bg-primary/50",
                f.estado === "error" && "bg-destructive",
                f.estado === "pendiente" && "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      <ol aria-label="Fases" className="flex flex-col gap-2">
        {fases.map((f, i) => (
          <li key={f.id} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] tabular-nums",
                f === actual
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {i + 1}
            </span>
            <span className={cn("flex-1", f === actual && "font-medium")}>
              {f.titulo}
            </span>
            <EstadoBadge estado={f.estado} texto={f.textoEstado} />
          </li>
        ))}
      </ol>

      <div className="flex flex-col gap-1">
        <h3 className="text-sm font-medium">Siguiente paso</h3>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {siguientePaso(actual)}
        </p>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="mt-auto w-full"
        onClick={() =>
          navegar(
            !actual
              ? "supabase"
              : actual.id === "extraccion"
                ? "extraccion"
                : actual.pestana
          )
        }
      >
        {actual ? `Ir a ${actual.titulo}` : "Ver datos en Supabase"}
      </Button>
    </section>
  )
}
