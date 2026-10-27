"use client"

import * as React from "react"

import type { PipelineEtl } from "@/hooks/use-pipeline-etl"
import {
  escalaEje,
  METRICAS,
  resumirPorCiudad,
  type Metrica,
  type ResumenCiudad,
  type ResumenMetrica,
} from "@/lib/etl/resumen"
import { cn } from "@/lib/utils"

import { formatoEntero, formatoMedida } from "./formato"
import { Selector } from "./selector"

const ALTO = "h-56"
const TEXTURA =
  "bg-[repeating-linear-gradient(135deg,var(--color-border)_0_4px,transparent_4px_8px)]"

export function GraficoCiudades({ etl }: { etl: PipelineEtl }) {
  const [metrica, setMetrica] = React.useState<Metrica>("temperatura")
  const [activa, setActiva] = React.useState<string | null>(null)
  const validos = etl.procesado?.limpieza.validos
  const resumen = React.useMemo(
    () => (validos?.length ? resumirPorCiudad(validos, metrica) : null),
    [validos, metrica]
  )
  const { titulo, unidad, agregado } = METRICAS[metrica]

  return (
    <section
      aria-labelledby="titulo-grafico"
      className="flex flex-col gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="titulo-grafico" className="text-base font-medium">
            {titulo} por ciudad
          </h2>
          <p className="text-sm text-muted-foreground">
            Calculado con los registros válidos
            {agregado === "suma" ? " (suma de todas las horas)" : ""}.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only">Métrica</span>
          <Selector
            value={metrica}
            onChange={(e) => setMetrica(e.target.value as Metrica)}
          >
            {(Object.keys(METRICAS) as Metrica[]).map((m) => (
              <option key={m} value={m}>
                {METRICAS[m].titulo}
              </option>
            ))}
          </Selector>
        </label>
      </header>

      {!resumen ? (
        <GraficoVacio />
      ) : (
        <>
          <Destacados resumen={resumen} unidad={unidad} agregado={agregado} />
          <Barras
            ciudades={resumen.ciudades}
            unidad={unidad}
            activa={activa}
            setActiva={setActiva}
          />
          <table className="sr-only">
            <caption>
              {titulo} por ciudad ({unidad})
            </caption>
            <thead>
              <tr>
                <th scope="col">Ciudad</th>
                <th scope="col">Valor</th>
                <th scope="col">Horas</th>
              </tr>
            </thead>
            <tbody>
              {resumen.ciudades.map((c) => (
                <tr key={c.ciudad}>
                  <th scope="row">{c.ciudad}</th>
                  <td>{formatoMedida(c.valor, unidad)}</td>
                  <td>{c.registros}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  )
}

function Destacados({
  resumen,
  unidad,
  agregado,
}: {
  resumen: ResumenMetrica
  unidad: string
  agregado: "media" | "suma"
}) {
  const ordenadas = [...resumen.ciudades].sort((a, b) => b.valor - a.valor)
  const max = ordenadas[0]
  const min = ordenadas[ordenadas.length - 1]
  return (
    <dl className="flex flex-wrap gap-x-8 gap-y-3">
      <div>
        <dt className="text-xs text-muted-foreground">
          {agregado === "media" ? "Media de todas las horas" : "Total"}
        </dt>
        <dd className="text-3xl font-semibold tracking-tight tabular-nums">
          {formatoMedida(resumen.global, unidad)}
        </dd>
      </div>
      {ordenadas.length > 1 && (
        <>
          <div>
            <dt className="text-xs text-muted-foreground">Máximo</dt>
            <dd className="text-lg font-medium tabular-nums">
              {formatoMedida(max.valor, unidad)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {max.ciudad}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Mínimo</dt>
            <dd className="text-lg font-medium tabular-nums">
              {formatoMedida(min.valor, unidad)}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {min.ciudad}
              </span>
            </dd>
          </div>
        </>
      )}
    </dl>
  )
}

function Barras({
  ciudades,
  unidad,
  activa,
  setActiva,
}: {
  ciudades: ResumenCiudad[]
  unidad: string
  activa: string | null
  setActiva: (c: string | null) => void
}) {
  const escala = escalaEje(ciudades.map((c) => c.valor))
  const pct = (v: number) =>
    ((v - escala.min) / (escala.max - escala.min)) * 100
  const cero = pct(0)

  return (
    <div aria-hidden className="grid grid-cols-[2.5rem_1fr] gap-2">
      <div className={cn("relative", ALTO)}>
        {escala.marcas.map((m) => (
          <span
            key={m}
            className="absolute right-0 translate-y-1/2 text-xs text-muted-foreground tabular-nums"
            style={{ bottom: `${pct(m)}%` }}
          >
            {formatoEntero(m)}
          </span>
        ))}
      </div>
      <div className="relative">
        <div
          className={cn("pointer-events-none absolute inset-x-0 top-0", ALTO)}
        >
          {escala.marcas.map((m) => (
            <span
              key={m}
              className={cn(
                "absolute inset-x-0 border-t",
                m === 0 ? "border-foreground/30" : "border-dashed"
              )}
              style={{ bottom: `${pct(m)}%` }}
            />
          ))}
        </div>
        <div className="relative flex gap-1 sm:gap-2">
          {ciudades.map((c) => {
            const y = pct(c.valor)
            const esActiva = activa === c.ciudad
            return (
              <div
                key={c.ciudad}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => setActiva(c.ciudad)}
                  onMouseLeave={() => setActiva(null)}
                  onClick={() => setActiva(esActiva ? null : c.ciudad)}
                  className={cn("relative w-full cursor-default", ALTO)}
                >
                  <span
                    className={cn(
                      "absolute left-1/2 w-full max-w-14 -translate-x-1/2 transition-opacity",
                      c.valor >= 0 ? "rounded-t-[4px]" : "rounded-b-[4px]",
                      "bg-primary",
                      activa && !esActiva && "opacity-30"
                    )}
                    style={{
                      bottom: `${Math.min(cero, y)}%`,
                      height: `${Math.abs(y - cero)}%`,
                    }}
                  />
                  {esActiva && (
                    <span
                      className="absolute left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-popover px-2.5 py-1.5 text-left text-xs whitespace-nowrap text-popover-foreground shadow-md ring-1 ring-foreground/10"
                      style={{ bottom: `${Math.max(cero, y)}%` }}
                    >
                      <span className="block font-medium">{c.ciudad}</span>
                      <span className="block tabular-nums">
                        {formatoMedida(c.valor, unidad)}
                      </span>
                      <span className="block text-muted-foreground tabular-nums">
                        {formatoEntero(c.registros)} horas
                      </span>
                    </span>
                  )}
                </button>
                <span
                  className={cn(
                    "truncate text-xs",
                    esActiva ? "font-medium" : "text-muted-foreground"
                  )}
                >
                  {c.ciudad}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** Barras fantasma con textura mientras no hay datos (como en un esqueleto). */
function GraficoVacio() {
  const alturas = [45, 70, 55, 85, 40]
  return (
    <div className="relative">
      <div aria-hidden className={cn("flex items-end gap-2 px-12", ALTO)}>
        {alturas.map((h, i) => (
          <span
            key={i}
            className={cn("mx-auto w-full max-w-14 rounded-t-[4px]", TEXTURA)}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
      <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
        <span className="rounded-lg bg-card/90 px-3 py-2 ring-1 ring-foreground/10">
          Extrae datos para ver el resumen por ciudad.
        </span>
      </p>
    </div>
  )
}
