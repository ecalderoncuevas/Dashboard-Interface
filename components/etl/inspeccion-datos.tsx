"use client"

import {
  CheckCircle2Icon,
  DatabaseIcon,
  FileJsonIcon,
  ShuffleIcon,
  UploadCloudIcon,
  XCircleIcon,
  type LucideIcon,
} from "lucide-react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PipelineEtl } from "@/hooks/use-pipeline-etl"

import { EncabezadoPaso } from "./encabezado-paso"
import { formatoEntero } from "./formato"
import { PestanaCarga } from "./pestana-carga"
import { PestanaJson } from "./pestana-json"
import { PestanaRechazados } from "./pestana-rechazados"
import { PestanaSupabase } from "./pestana-supabase"
import { PestanaTransformados } from "./pestana-transformados"
import { PestanaValidos } from "./pestana-validos"

export type Pestana =
  "json" | "transformados" | "validos" | "rechazados" | "carga" | "supabase"

/** Pestaña activa en relieve sobre la pista hundida (gana a la sombra por defecto). */
const ESTILO_PESTANA =
  "h-auto gap-2 rounded-xl px-3 py-2 data-active:bg-background data-active:text-foreground data-active:shadow-[3px_3px_7px_var(--neu-sombra),-3px_-3px_7px_var(--neu-luz)]! dark:data-active:border-transparent dark:data-active:bg-background"

export function InspeccionDatos({
  etl,
  pestana,
  setPestana,
}: {
  etl: PipelineEtl
  pestana: Pestana
  setPestana: (p: Pestana) => void
}) {
  const p = etl.procesado
  const pestanas: {
    valor: Pestana
    titulo: string
    icono: LucideIcon
    total?: number
    contenido: React.ReactNode
  }[] = [
    {
      valor: "json",
      titulo: "JSON original",
      icono: FileJsonIcon,
      contenido: <PestanaJson etl={etl} />,
    },
    {
      valor: "transformados",
      titulo: "Transformados",
      icono: ShuffleIcon,
      total: p?.transformacion.registros.length,
      contenido: <PestanaTransformados etl={etl} />,
    },
    {
      valor: "validos",
      titulo: "Válidos",
      icono: CheckCircle2Icon,
      total: p?.limpieza.validos.length,
      contenido: <PestanaValidos etl={etl} />,
    },
    {
      valor: "rechazados",
      titulo: "Rechazados",
      icono: XCircleIcon,
      total: p?.limpieza.rechazados.length,
      contenido: <PestanaRechazados etl={etl} />,
    },
    {
      valor: "carga",
      titulo: "Vista previa de la carga",
      icono: UploadCloudIcon,
      total: p ? etl.conjuntoCarga.registros.length : undefined,
      contenido: <PestanaCarga etl={etl} />,
    },
    {
      valor: "supabase",
      titulo: "Datos en Supabase",
      icono: DatabaseIcon,
      contenido: <PestanaSupabase etl={etl} />,
    },
  ]

  return (
    <section
      id="inspeccion"
      aria-labelledby="titulo-inspeccion"
      className="flex scroll-mt-28 flex-col gap-4 lg:scroll-mt-6"
    >
      <EncabezadoPaso
        numero={3}
        id="titulo-inspeccion"
        titulo="Datos"
        descripcion="Revisa los registros de cada fase, elige qué subir y consulta lo que ya está guardado en Supabase."
      />
      <Tabs
        value={pestana}
        onValueChange={(v) => setPestana(v as Pestana)}
        className="gap-5"
      >
        <div className="-mx-2 overflow-x-auto px-2 py-2">
          <TabsList className="h-auto gap-1 rounded-2xl neu-hundido p-1.5">
            {pestanas.map(({ valor, titulo, icono: Icono, total }) => (
              <TabsTrigger key={valor} value={valor} className={ESTILO_PESTANA}>
                <Icono aria-hidden className="text-marca" />
                {titulo}
                {total !== undefined && (
                  <span className="rounded-full bg-marca/15 px-1.5 py-0.5 text-[0.7rem] tabular-nums">
                    <span className="sr-only">(</span>
                    {formatoEntero(total)}
                    <span className="sr-only">)</span>
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {pestanas.map(({ valor, contenido }) => (
          <TabsContent
            key={valor}
            value={valor}
            className="rounded-3xl neu p-4 sm:p-6"
          >
            {contenido}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
