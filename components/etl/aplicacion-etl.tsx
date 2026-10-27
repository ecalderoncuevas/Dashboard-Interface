"use client"

import * as React from "react"
import {
  CalendarIcon,
  DownloadCloudIcon,
  Loader2Icon,
  MapPinIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePipelineEtl } from "@/hooks/use-pipeline-etl"

import { ActividadReciente } from "./actividad-reciente"
import { BarraLateral, TarjetaSupabase } from "./barra-lateral"
import { ConfiguracionExtraccion } from "./configuracion-extraccion"
import { GraficoCiudades } from "./grafico-ciudades"
import { InspeccionDatos, type Pestana } from "./inspeccion-datos"
import { PipelineVisual } from "./pipeline-visual"
import { TarjetaCalidad } from "./tarjeta-calidad"
import { TarjetaEstadoPipeline } from "./tarjeta-estado-pipeline"
import { TarjetasKpi } from "./tarjetas-kpi"

/** Una pestaña de inspección o una sección de la página. */
export type Destino = Pestana | "extraccion" | "pipeline"

export function AplicacionEtl() {
  const etl = usePipelineEtl()
  const [pestana, setPestana] = React.useState<Pestana>("json")

  const navegar = (destino: Destino) => {
    let id: string = destino
    if (destino !== "extraccion" && destino !== "pipeline") {
      setPestana(destino)
      id = "inspeccion"
    }
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const { config, extraccion, validacion } = etl
  const ocupado = Boolean(extraccion?.enCurso) || Boolean(etl.carga?.enCurso)

  return (
    <div className="min-h-svh bg-muted/40 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <BarraLateral etl={etl} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8">
        <section
          id="resumen"
          className="flex scroll-mt-28 flex-col gap-6 lg:scroll-mt-6"
        >
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                Pipeline ETL: Open-Meteo → Supabase
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Extrae datos meteorológicos horarios, transfórmalos, límpialos,
                decide qué registros subir y cárgalos en una base de datos.
              </p>
              <p className="mt-1 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 ring-1 ring-foreground/10">
                  <CalendarIcon aria-hidden className="size-3.5" />
                  {config.fechaInicio} → {config.fechaFin} (UTC)
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 ring-1 ring-foreground/10">
                  <MapPinIcon aria-hidden className="size-3.5" />
                  {config.ciudades.length === 0
                    ? "Ninguna ciudad"
                    : config.ciudades.join(", ")}
                </span>
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => void etl.extraer()}
              disabled={ocupado || validacion.errores.length > 0}
            >
              {extraccion?.enCurso ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <DownloadCloudIcon aria-hidden />
              )}
              Extraer datos
            </Button>
          </header>

          <TarjetasKpi etl={etl} />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <GraficoCiudades etl={etl} />
            <TarjetaEstadoPipeline etl={etl} navegar={navegar} />
            <ActividadReciente etl={etl} />
            <TarjetaCalidad etl={etl} navegar={navegar} />
          </div>

          <TarjetaSupabase etl={etl} className="lg:hidden" />
        </section>

        <div id="extraccion" className="scroll-mt-28 lg:scroll-mt-6">
          <ConfiguracionExtraccion etl={etl} />
        </div>
        <div id="pipeline" className="scroll-mt-28 lg:scroll-mt-6">
          <PipelineVisual etl={etl} alInspeccionar={navegar} />
        </div>
        <InspeccionDatos etl={etl} pestana={pestana} setPestana={setPestana} />
      </main>
    </div>
  )
}
