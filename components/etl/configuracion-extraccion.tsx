"use client"

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  DownloadCloudIcon,
  Loader2Icon,
  RotateCcwIcon,
  XCircleIcon,
} from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DescargaCiudad, PipelineEtl } from "@/hooks/use-pipeline-etl"
import { CIUDADES } from "@/lib/etl/ciudades"
import {
  calcularVolumen,
  FECHA_MINIMA,
  hoyUtc,
  MAX_DIAS_EXTRACCION,
} from "@/lib/etl/extraccion"

import { formatoDuracion, formatoEntero } from "./formato"

export function ConfiguracionExtraccion({ etl }: { etl: PipelineEtl }) {
  const { config, setConfig, validacion, extraccion } = etl
  const volumen = calcularVolumen(config)
  const ocupado = Boolean(extraccion?.enCurso) || Boolean(etl.carga?.enCurso)

  const alternarCiudad = (nombre: string, marcar: boolean) =>
    setConfig((c) => ({
      ...c,
      ciudades: marcar
        ? [...c.ciudades, nombre]
        : c.ciudades.filter((x) => x !== nombre),
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>1. Configuración de extracción</CardTitle>
        <CardDescription>
          API histórica de Open-Meteo · horas en UTC · temperatura en °C ·
          precipitación en mm · máximo {MAX_DIAS_EXTRACCION} días.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            void etl.extraer()
          }}
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">Ciudades</legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {CIUDADES.map((c) => (
                <Label key={c.nombre} className="font-normal">
                  <Checkbox
                    checked={config.ciudades.includes(c.nombre)}
                    onCheckedChange={(v) => alternarCiudad(c.nombre, v)}
                    disabled={ocupado}
                  />
                  {c.nombre}
                </Label>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-inicio">Fecha inicial</Label>
              <Input
                id="fecha-inicio"
                type="date"
                min={FECHA_MINIMA}
                max={hoyUtc()}
                value={config.fechaInicio}
                disabled={ocupado}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, fechaInicio: e.target.value }))
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="fecha-fin">Fecha final</Label>
              <Input
                id="fecha-fin"
                type="date"
                min={FECHA_MINIMA}
                max={hoyUtc()}
                value={config.fechaFin}
                disabled={ocupado}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, fechaFin: e.target.value }))
                }
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite">
            {volumen && validacion.errores.length === 0 ? (
              <>
                Volumen previsto:{" "}
                <strong className="text-foreground">
                  {formatoEntero(volumen.registrosPrevistos)} registros
                </strong>{" "}
                ({config.ciudades.length} ciudades × {volumen.dias} días × 24 h)
                en {volumen.peticiones} peticiones, una por ciudad.
              </>
            ) : (
              "Corrige la configuración para calcular el volumen."
            )}
          </p>

          {validacion.errores.length > 0 && (
            <Alert variant="destructive">
              <XCircleIcon aria-hidden />
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {validacion.errores.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          {validacion.avisos.map((a) => (
            <Alert key={a}>
              <AlertTriangleIcon aria-hidden />
              <AlertDescription>{a}</AlertDescription>
            </Alert>
          ))}

          <div>
            <Button
              type="submit"
              size="lg"
              disabled={ocupado || validacion.errores.length > 0}
            >
              {extraccion?.enCurso ? (
                <Loader2Icon className="animate-spin" aria-hidden />
              ) : (
                <DownloadCloudIcon aria-hidden />
              )}
              Extraer datos
            </Button>
          </div>
        </form>

        <ProgresoExtraccion etl={etl} />
      </CardContent>
    </Card>
  )
}

const ICONOS_DESCARGA = {
  pendiente: { icono: CircleDashedIcon, texto: "Pendiente" },
  descargando: { icono: Loader2Icon, texto: "Descargando…" },
  ok: { icono: CheckCircle2Icon, texto: "Descargada" },
  error: { icono: XCircleIcon, texto: "Error" },
}

function ProgresoExtraccion({ etl }: { etl: PipelineEtl }) {
  const { extraccion } = etl
  if (!extraccion) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Aún no se ha extraído nada. Las respuestas originales se guardarán en
        esta sesión del navegador.
      </div>
    )
  }

  const procesadas = extraccion.descargas.filter(
    (d) => d.estado === "ok" || d.estado === "error"
  ).length
  const pendientes = extraccion.descargas.length - procesadas

  return (
    <section
      aria-label="Progreso de la extracción"
      className="flex flex-col gap-2"
    >
      <p className="text-sm font-medium" aria-live="polite">
        Ciudades procesadas: {procesadas} de {extraccion.descargas.length}
        {pendientes > 0 && ` · pendientes: ${pendientes}`}
      </p>
      <p className="text-xs text-muted-foreground">
        Periodo extraído: {extraccion.config.fechaInicio} →{" "}
        {extraccion.config.fechaFin} (UTC)
      </p>
      <ul className="flex flex-col divide-y rounded-lg border">
        {extraccion.descargas.map((d) => (
          <FilaDescarga
            key={d.ciudad}
            descarga={d}
            ocupado={extraccion.enCurso || Boolean(etl.carga?.enCurso)}
            reintentar={() => void etl.reintentarCiudad(d.ciudad)}
          />
        ))}
      </ul>
    </section>
  )
}

function FilaDescarga({
  descarga: d,
  ocupado,
  reintentar,
}: {
  descarga: DescargaCiudad
  ocupado: boolean
  reintentar: () => void
}) {
  const { icono: Icono, texto } = ICONOS_DESCARGA[d.estado]
  const horas = Array.isArray(d.json?.hourly?.time)
    ? (d.json.hourly.time as unknown[]).length
    : null
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
      <Icono
        aria-hidden
        className={
          d.estado === "descargando"
            ? "size-4 animate-spin text-sky-600"
            : d.estado === "ok"
              ? "size-4 text-emerald-600"
              : d.estado === "error"
                ? "size-4 text-red-600"
                : "size-4 text-muted-foreground"
        }
      />
      <span className="min-w-20 font-medium">{d.ciudad}</span>
      <span className="text-muted-foreground">{texto}</span>
      {d.estado === "ok" && horas !== null && (
        <span className="text-muted-foreground tabular-nums">
          {formatoEntero(horas)} horas · {formatoDuracion(d.duracionMs)}
        </span>
      )}
      {d.estado === "error" && (
        <>
          <span className="basis-full text-xs text-red-700 dark:text-red-300">
            {d.error}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={reintentar}
            disabled={ocupado}
          >
            <RotateCcwIcon aria-hidden />
            Reintentar {d.ciudad}
          </Button>
        </>
      )}
    </li>
  )
}
