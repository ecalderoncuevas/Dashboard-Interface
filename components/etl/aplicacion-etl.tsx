"use client"

import * as React from "react"
import { DatabaseIcon } from "lucide-react"

import { usePipelineEtl } from "@/hooks/use-pipeline-etl"
import { cn } from "@/lib/utils"

import { ConfiguracionExtraccion } from "./configuracion-extraccion"
import { InspeccionDatos, type Pestana } from "./inspeccion-datos"
import { Contadores, PipelineVisual } from "./pipeline-visual"

export function AplicacionEtl() {
  const etl = usePipelineEtl()
  const [pestana, setPestana] = React.useState<Pestana>("json")

  const inspeccionar = (p: Pestana) => {
    setPestana(p)
    document
      .getElementById("inspeccion")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const sb = etl.estadoSupabase
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Pipeline ETL: Open-Meteo → Supabase
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Práctica de Big Data: extrae datos meteorológicos horarios,
            transfórmalos, límpialos, decide qué registros subir y cárgalos en
            una base de datos. Cada fase muestra sus datos reales.
          </p>
        </div>
        <p
          role="status"
          className={cn(
            "flex max-w-sm items-start gap-2 rounded-lg border px-3 py-2 text-xs",
            sb?.tablaAccesible
              ? "border-emerald-600/30"
              : sb
                ? "border-red-600/30"
                : ""
          )}
        >
          <DatabaseIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <strong>
              Supabase:{" "}
              {!sb
                ? "comprobando…"
                : sb.tablaAccesible
                  ? "✓ conectado"
                  : sb.configurado
                    ? "✗ tabla no disponible"
                    : "✗ sin configurar"}
            </strong>
            {sb && (
              <span className="block text-muted-foreground">{sb.mensaje}</span>
            )}
          </span>
        </p>
      </header>

      <ConfiguracionExtraccion etl={etl} />
      <PipelineVisual etl={etl} alInspeccionar={inspeccionar} />
      <Contadores etl={etl} />
      <InspeccionDatos etl={etl} pestana={pestana} setPestana={setPestana} />
    </main>
  )
}
