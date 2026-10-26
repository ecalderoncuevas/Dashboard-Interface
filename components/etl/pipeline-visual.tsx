"use client"

import { ArrowDownIcon, ArrowRightIcon } from "lucide-react"

import type { PipelineEtl } from "@/hooks/use-pipeline-etl"
import { resumirCarga } from "@/lib/etl/carga"
import type { EstadoFase } from "@/lib/etl/tipos"
import { cn } from "@/lib/utils"

import { EstadoBadge } from "./estado-badge"
import { formatoDuracion, formatoEntero } from "./formato"
import type { Pestana } from "./inspeccion-datos"

interface Fase {
  id: string
  titulo: string
  explicacion: string
  estado: EstadoFase
  textoEstado?: string
  entrada: string
  salida: string
  extra?: string
  duracionMs: number | null
  pestana: Pestana
}

function calcularFases(etl: PipelineEtl): Fase[] {
  const { extraccion, procesado, carga, conjuntoCarga, filtradosOrdenados } =
    etl

  // 1. Extracción
  const descargas = extraccion?.descargas ?? []
  const fallidas = descargas.filter((d) => d.estado === "error").length
  const filasRecibidas = procesado?.transformacion.diagnosticos.reduce(
    (s, d) => s + d.registrosGenerados,
    0
  )
  const horasPrevistas = extraccion
    ? descargas.length *
      24 *
      (Math.round(
        (Date.parse(extraccion.config.fechaFin) -
          Date.parse(extraccion.config.fechaInicio)) /
          86_400_000
      ) +
        1)
    : 0
  const estadoExtraccion: EstadoFase = !extraccion
    ? "pendiente"
    : extraccion.enCurso
      ? "en_curso"
      : fallidas > 0
        ? "error"
        : "completada"

  // 2. Transformación
  const diagnosticos = procesado?.transformacion.diagnosticos ?? []
  const conAvisosEstructurales = diagnosticos.filter((d) => !d.coherente).length
  const estadoTransformacion: EstadoFase = !procesado
    ? "pendiente"
    : conAvisosEstructurales > 0
      ? "error"
      : "completada"

  // 3. Limpieza
  const limpieza = procesado?.limpieza
  const estadoLimpieza: EstadoFase = limpieza ? "completada" : "pendiente"

  // 4. Filtrado y selección
  const nValidos = limpieza?.validos.length ?? 0
  const nSeleccion = conjuntoCarga.registros.length
  const automatico = etl.modoSeleccion === "automatico"
  // En modo automático la fase se completa sola: la selección es el resultado de los filtros.
  const estadoFiltrado: EstadoFase = !limpieza
    ? "pendiente"
    : etl.filtrosInterpretados.errores.length > 0
      ? "error"
      : automatico || nSeleccion > 0
        ? "completada"
        : "en_curso"

  // 5. Carga
  const resumen = carga ? resumirCarga(carga.lotes) : null
  const estadoCarga: EstadoFase = !carga
    ? "pendiente"
    : carga.enCurso
      ? "en_curso"
      : resumen!.fallidos > 0 ||
          carga.verificacion.estado === "error" ||
          (carga.verificacion.estado === "completada" &&
            carga.verificacion.resultado.faltantes.length > 0)
        ? "error"
        : "completada"

  return [
    {
      id: "extraccion",
      titulo: "Extracción",
      explicacion:
        "Una petición HTTP por ciudad a la API histórica. Se guarda el JSON original sin tocar.",
      estado: estadoExtraccion,
      entrada: extraccion
        ? `${descargas.length} ciudades · ${formatoEntero(horasPrevistas)} h previstas`
        : "—",
      salida:
        filasRecibidas !== undefined
          ? `${formatoEntero(filasRecibidas)} posiciones horarias`
          : "—",
      extra: fallidas > 0 ? `${fallidas} ciudad(es) con error` : undefined,
      duracionMs: extraccion?.duracionMs ?? null,
      pestana: "json",
    },
    {
      id: "transformacion",
      titulo: "Transformación",
      explicacion:
        "Los arrays paralelos (time, temperature_2m…) se convierten en un registro por ciudad y hora, con fecha en UTC.",
      estado: estadoTransformacion,
      textoEstado:
        conAvisosEstructurales > 0 ? "Arrays incoherentes" : undefined,
      entrada:
        filasRecibidas !== undefined
          ? `${formatoEntero(filasRecibidas)} posiciones`
          : "—",
      salida: procesado
        ? `${formatoEntero(procesado.transformacion.registros.length)} registros`
        : "—",
      duracionMs: procesado?.transformacion.duracionMs ?? null,
      pestana: "transformados",
    },
    {
      id: "limpieza",
      titulo: "Limpieza",
      explicacion:
        "Se rechazan filas sin fecha o sin alguna medición, humedad fuera de 0–100, lluvia negativa y duplicados.",
      estado: estadoLimpieza,
      entrada: procesado
        ? `${formatoEntero(procesado.transformacion.registros.length)} registros`
        : "—",
      salida: limpieza ? `${formatoEntero(nValidos)} válidos` : "—",
      extra: limpieza
        ? `${formatoEntero(limpieza.rechazados.length)} rechazados`
        : undefined,
      duracionMs: limpieza?.duracionMs ?? null,
      pestana: "rechazados",
    },
    {
      id: "filtrado",
      titulo: "Filtrado y selección",
      explicacion:
        "Filtros → orden → selección. Por defecto se selecciona automáticamente todo lo que cumple los filtros; puedes ajustarlo a mano.",
      estado: estadoFiltrado,
      textoEstado:
        estadoFiltrado === "en_curso"
          ? "Esperando selección"
          : estadoFiltrado === "error"
            ? "Filtros no válidos"
            : undefined,
      entrada: limpieza ? `${formatoEntero(nValidos)} válidos` : "—",
      salida: limpieza ? `${formatoEntero(nSeleccion)} seleccionados` : "—",
      extra: limpieza
        ? `${formatoEntero(filtradosOrdenados.length)} coinciden · selección ${automatico ? "automática" : "manual"}`
        : undefined,
      duracionMs: limpieza ? etl.duracionFiltradoMs : null,
      pestana: "validos",
    },
    {
      id: "carga",
      titulo: "Carga",
      explicacion:
        "Upsert en Supabase por (ciudad, fecha_hora) en lotes de 500 y verificación posterior de las claves.",
      estado: estadoCarga,
      entrada: carga
        ? `${formatoEntero(carga.registros.length)} congelados`
        : "—",
      salida: resumen
        ? `${formatoEntero(resumen.completados)} confirmados`
        : "—",
      extra:
        resumen && resumen.fallidos > 0
          ? `${formatoEntero(resumen.fallidos)} fallidos`
          : carga?.verificacion.estado === "completada"
            ? `${formatoEntero(carga.verificacion.resultado.encontradas)} verificados en destino`
            : undefined,
      duracionMs: carga?.duracionMs ?? null,
      pestana: "carga",
    },
  ]
}

export function PipelineVisual({
  etl,
  alInspeccionar,
}: {
  etl: PipelineEtl
  alInspeccionar: (pestana: Pestana) => void
}) {
  const fases = calcularFases(etl)
  return (
    <section aria-labelledby="titulo-pipeline" className="flex flex-col gap-3">
      <h2 id="titulo-pipeline" className="text-base font-medium">
        2. Pipeline
      </h2>
      <ol className="grid gap-2 lg:grid-cols-[repeat(5,minmax(0,1fr))] lg:gap-0">
        {fases.map((f, i) => (
          <li key={f.id} className="flex flex-col items-stretch lg:flex-row">
            <button
              type="button"
              onClick={() => alInspeccionar(f.pestana)}
              className={cn(
                "flex flex-1 flex-col gap-2 rounded-xl bg-card p-3 text-left text-sm ring-1 ring-foreground/10 transition-colors outline-none hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50",
                f.estado === "error" && "ring-red-600/40",
                f.estado === "en_curso" && "ring-sky-600/40"
              )}
              aria-label={`Fase ${i + 1}: ${f.titulo}. Inspeccionar resultados`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">
                  <span className="text-muted-foreground">{i + 1}.</span>{" "}
                  {f.titulo}
                </span>
                <EstadoBadge estado={f.estado} texto={f.textoEstado} />
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {f.explicacion}
              </p>
              <dl className="mt-auto grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
                <dt className="text-muted-foreground">Entrada</dt>
                <dd className="tabular-nums">{f.entrada}</dd>
                <dt className="text-muted-foreground">Salida</dt>
                <dd className="font-medium tabular-nums">{f.salida}</dd>
                {f.extra && (
                  <>
                    <dt className="sr-only">Detalle</dt>
                    <dd className="col-span-2 text-muted-foreground tabular-nums">
                      {f.extra}
                    </dd>
                  </>
                )}
                <dt className="text-muted-foreground">Duración</dt>
                <dd className="tabular-nums">
                  {formatoDuracion(f.duracionMs)}
                </dd>
              </dl>
              <span className="text-xs text-muted-foreground underline underline-offset-2">
                Inspeccionar
              </span>
            </button>
            {i < fases.length - 1 && (
              <span
                aria-hidden
                className="flex items-center justify-center py-1 text-muted-foreground lg:px-1 lg:py-0"
              >
                <ArrowDownIcon className="size-4 lg:hidden" />
                <ArrowRightIcon className="hidden size-4 lg:block" />
              </span>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function Contadores({ etl }: { etl: PipelineEtl }) {
  const { procesado, filtradosOrdenados, conjuntoCarga } = etl
  const items: [string, number | null, string][] = [
    [
      "Total extraído",
      procesado ? procesado.transformacion.registros.length : null,
      "Registros generados a partir de las respuestas",
    ],
    [
      "Válidos",
      procesado ? procesado.limpieza.validos.length : null,
      "Superan las reglas de calidad",
    ],
    [
      "Rechazados",
      procesado ? procesado.limpieza.rechazados.length : null,
      "Descartes por calidad o duplicado",
    ],
    [
      "Coinciden con los filtros",
      procesado ? filtradosOrdenados.length : null,
      "Válidos que cumplen los filtros actuales",
    ],
    [
      "Seleccionados para cargar",
      procesado ? conjuntoCarga.registros.length : null,
      "Seleccionados y dentro de los filtros",
    ],
  ]
  return (
    <section aria-label="Contadores del pipeline">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(([titulo, valor, ayuda]) => (
          <div
            key={titulo}
            className="flex flex-col gap-0.5 rounded-xl bg-card p-3 ring-1 ring-foreground/10"
          >
            <dt className="text-xs text-muted-foreground">{titulo}</dt>
            <dd className="text-2xl font-semibold tabular-nums">
              {valor === null ? "—" : formatoEntero(valor)}
            </dd>
            <dd className="text-xs text-muted-foreground">{ayuda}</dd>
          </div>
        ))}
      </dl>
      {conjuntoCarga.seleccionadosFueraDeFiltro > 0 && (
        <p
          className="mt-2 text-sm text-amber-800 dark:text-amber-300"
          role="status"
        >
          ⚠ {formatoEntero(conjuntoCarga.seleccionadosFueraDeFiltro)} fila(s)
          seleccionada(s) quedan fuera de los filtros actuales y no se subirán.
        </p>
      )}
    </section>
  )
}
