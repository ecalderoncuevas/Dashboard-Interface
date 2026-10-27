"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { PipelineEtl } from "@/hooks/use-pipeline-etl"

import { formatoEntero } from "./formato"
import { PestanaCarga } from "./pestana-carga"
import { PestanaJson } from "./pestana-json"
import { PestanaRechazados } from "./pestana-rechazados"
import { PestanaSupabase } from "./pestana-supabase"
import { PestanaTransformados } from "./pestana-transformados"
import { PestanaValidos } from "./pestana-validos"

export type Pestana =
  "json" | "transformados" | "validos" | "rechazados" | "carga" | "supabase"

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
  const contador = (n: number | undefined) =>
    n === undefined ? "" : ` (${formatoEntero(n)})`

  return (
    <section
      id="inspeccion"
      aria-labelledby="titulo-inspeccion"
      className="flex scroll-mt-28 flex-col gap-3 lg:scroll-mt-6"
    >
      <h2 id="titulo-inspeccion" className="text-base font-medium">
        3. Inspección de datos
      </h2>
      <Tabs value={pestana} onValueChange={(v) => setPestana(v as Pestana)}>
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <TabsList>
            <TabsTrigger value="json">JSON original</TabsTrigger>
            <TabsTrigger value="transformados">
              Transformados{contador(p?.transformacion.registros.length)}
            </TabsTrigger>
            <TabsTrigger value="validos">
              Válidos{contador(p?.limpieza.validos.length)}
            </TabsTrigger>
            <TabsTrigger value="rechazados">
              Rechazados{contador(p?.limpieza.rechazados.length)}
            </TabsTrigger>
            <TabsTrigger value="carga">
              Vista previa de la carga
              {contador(p ? etl.conjuntoCarga.registros.length : undefined)}
            </TabsTrigger>
            <TabsTrigger value="supabase">Datos en Supabase</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="json">
          <PestanaJson etl={etl} />
        </TabsContent>
        <TabsContent value="transformados">
          <PestanaTransformados etl={etl} />
        </TabsContent>
        <TabsContent value="validos">
          <PestanaValidos etl={etl} />
        </TabsContent>
        <TabsContent value="rechazados">
          <PestanaRechazados etl={etl} />
        </TabsContent>
        <TabsContent value="carga">
          <PestanaCarga etl={etl} />
        </TabsContent>
        <TabsContent value="supabase">
          <PestanaSupabase etl={etl} />
        </TabsContent>
      </Tabs>
    </section>
  )
}
