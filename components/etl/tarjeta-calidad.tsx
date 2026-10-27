"use client"

import * as React from "react"
import { ArrowUpRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PipelineEtl } from "@/hooks/use-pipeline-etl"
import { motivosFrecuentes } from "@/lib/etl/resumen"

import type { Destino } from "./aplicacion-etl"
import { formatoEntero, formatoPorcentaje } from "./formato"

const SEGMENTOS = 24

/** Medidor semicircular por segmentos: cada segmento es 1/24 del total. */
function Medidor({ fraccion }: { fraccion: number | null }) {
  const llenos = fraccion === null ? 0 : Math.round(fraccion * SEGMENTOS)
  return (
    <svg viewBox="0 0 200 108" aria-hidden className="w-full max-w-60">
      {Array.from({ length: SEGMENTOS }, (_, i) => {
        const a = Math.PI - ((i + 0.5) / SEGMENTOS) * Math.PI
        // Redondeado: Node y el navegador difieren en los últimos decimales
        // de Math.sin y eso rompería la hidratación.
        const punto = (r: number) =>
          [100 + r * Math.cos(a), 100 - r * Math.sin(a)].map(
            (v) => Math.round(v * 100) / 100
          )
        const [x1, y1] = punto(72)
        const [x2, y2] = punto(92)
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            strokeWidth={8}
            strokeLinecap="round"
            className={i < llenos ? "stroke-primary" : "stroke-muted"}
          />
        )
      })}
    </svg>
  )
}

export function TarjetaCalidad({
  etl,
  navegar,
}: {
  etl: PipelineEtl
  navegar: (destino: Destino) => void
}) {
  const limpieza = etl.procesado?.limpieza
  const validos = limpieza?.validos.length ?? 0
  const rechazados = limpieza?.rechazados.length ?? 0
  const total = validos + rechazados
  const motivos = React.useMemo(
    () => (limpieza ? motivosFrecuentes(limpieza.rechazados) : []),
    [limpieza]
  )

  return (
    <section
      aria-labelledby="titulo-calidad"
      className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="titulo-calidad" className="text-base font-medium">
            Calidad de los datos
          </h2>
          <p className="text-sm text-muted-foreground">
            Porcentaje de registros que pasan la limpieza.
          </p>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full"
          aria-label="Ver los registros rechazados"
          onClick={() => navegar("rechazados")}
        >
          <ArrowUpRightIcon aria-hidden />
        </Button>
      </header>

      <div className="relative mx-auto flex w-full justify-center">
        <Medidor fraccion={total > 0 ? validos / total : null} />
        <p className="absolute inset-x-0 bottom-0 text-center">
          <span className="block text-3xl font-semibold tracking-tight tabular-nums">
            {formatoPorcentaje(validos, total)}
          </span>
          <span className="text-xs text-muted-foreground">válidos</span>
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-2 text-center">
        <div>
          <dt className="text-xs text-muted-foreground">Válidos</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {limpieza ? formatoEntero(validos) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Rechazados</dt>
          <dd className="text-lg font-semibold tabular-nums">
            {limpieza ? formatoEntero(rechazados) : "—"}
          </dd>
        </div>
      </dl>

      {limpieza && (
        <div className="flex flex-col gap-2 border-t pt-3">
          <h3 className="text-sm font-medium">Motivos de rechazo</h3>
          {motivos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ningún registro rechazado.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-sm">
              {motivos.map((m) => (
                <li key={m.motivo} className="flex justify-between gap-3">
                  <span className="truncate" title={m.motivo}>
                    {m.motivo}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatoEntero(m.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
