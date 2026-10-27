"use client"

import * as React from "react"
import {
  CloudDownloadIcon,
  CloudSunIcon,
  DatabaseIcon,
  LayoutDashboardIcon,
  MapIcon,
  RefreshCwIcon,
  Table2Icon,
  WorkflowIcon,
} from "lucide-react"

import { BotonTema } from "@/components/selector-tema"
import { Button } from "@/components/ui/button"
import type { PipelineEtl } from "@/hooks/use-pipeline-etl"
import type { EstadoSupabase } from "@/lib/etl/api-cliente"
import { cn } from "@/lib/utils"

import { formatoEntero } from "./formato"

export const SECCIONES = [
  { id: "mapa", titulo: "Mapa", icono: MapIcon },
  { id: "resumen", titulo: "Resumen", icono: LayoutDashboardIcon },
  { id: "extraccion", titulo: "Extracción", icono: CloudDownloadIcon },
  { id: "pipeline", titulo: "Pipeline", icono: WorkflowIcon },
  { id: "inspeccion", titulo: "Datos", icono: Table2Icon },
] as const

/** Marca como activa la sección que ocupa el centro de la pantalla. */
function useSeccionActiva() {
  const [activa, setActiva] = React.useState<string>(SECCIONES[0].id)
  React.useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setActiva(e.target.id)
      },
      { rootMargin: "-45% 0px -50% 0px" }
    )
    for (const s of SECCIONES) {
      const el = document.getElementById(s.id)
      if (el) observador.observe(el)
    }
    return () => observador.disconnect()
  }, [])
  return activa
}

function Navegacion({
  etl,
  horizontal,
}: {
  etl: PipelineEtl
  horizontal?: boolean
}) {
  const activa = useSeccionActiva()
  const validos = etl.procesado?.limpieza.validos.length
  return (
    <nav aria-label="Secciones">
      <ul
        className={cn(
          "flex gap-1",
          horizontal ? "overflow-x-auto" : "flex-col"
        )}
      >
        {SECCIONES.map(({ id, titulo, icono: Icono }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              aria-current={activa === id ? "location" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                activa === id && "bg-accent font-medium text-accent-foreground"
              )}
            >
              <Icono aria-hidden className="size-4" />
              {titulo}
              {id === "inspeccion" && validos !== undefined && (
                <span className="ml-auto rounded-full bg-primary px-1.5 text-xs text-primary-foreground tabular-nums">
                  {formatoEntero(validos)}
                </span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Distingue "faltan variables" de "el servidor no responde" (p. ej. un 403). */
function textoEstado(sb: EstadoSupabase | null) {
  if (!sb) return "Comprobando…"
  if (sb.tablaAccesible) return "Conectado"
  if (sb.configurado) return "Tabla no disponible"
  if (sb.faltan.length > 0) return "Sin configurar"
  return "Sin acceso"
}

export function TarjetaSupabase({
  etl,
  className,
}: {
  etl: PipelineEtl
  className?: string
}) {
  const sb = etl.estadoSupabase
  const [comprobando, setComprobando] = React.useState(false)
  const comprobar = async () => {
    setComprobando(true)
    await etl.refrescarEstadoSupabase()
    setComprobando(false)
  }
  return (
    <section
      aria-label="Estado de Supabase"
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-primary p-4 text-primary-foreground",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
          <DatabaseIcon aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xs opacity-70">Destino · Supabase</p>
          <p className="flex items-center gap-1.5 font-medium" role="status">
            <span
              aria-hidden
              className={cn(
                "size-2 rounded-full",
                !sb
                  ? "bg-primary-foreground/40"
                  : sb.tablaAccesible
                    ? "bg-emerald-400"
                    : "bg-red-400"
              )}
            />
            {textoEstado(sb)}
          </p>
        </div>
      </div>
      {sb && (
        <p className="text-xs leading-relaxed opacity-70">
          {sb.tablaAccesible && sb.totalFilas !== undefined
            ? `${formatoEntero(sb.totalFilas)} filas guardadas.`
            : sb.mensaje}
        </p>
      )}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => void comprobar()}
        disabled={comprobando}
      >
        <RefreshCwIcon
          aria-hidden
          className={cn(comprobando && "animate-spin")}
        />
        Comprobar conexión
      </Button>
    </section>
  )
}

export function BarraLateral({ etl }: { etl: PipelineEtl }) {
  return (
    <>
      <aside className="sticky top-0 hidden h-svh flex-col gap-8 border-r bg-card p-5 lg:flex">
        <Marca />
        <Navegacion etl={etl} />
        <div className="mt-auto flex flex-col gap-4">
          <BotonTema conTexto />
          <TarjetaSupabase etl={etl} />
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex flex-col gap-3 border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Marca />
          <BotonTema />
        </div>
        <Navegacion etl={etl} horizontal />
      </header>
    </>
  )
}

function Marca() {
  return (
    <a
      href="#mapa"
      className="flex items-center gap-2.5 font-semibold tracking-tight"
    >
      <span className="flex size-8 items-center justify-center rounded-lg bg-marca text-marca-foreground">
        <CloudSunIcon aria-hidden className="size-4.5" />
      </span>
      Meteo ETL
    </a>
  )
}
