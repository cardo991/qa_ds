import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { SECTIONS, ALL_ITEMS, calcularPorcentaje } from '@/lib/questionnaire'
import type { Resultado } from '@/lib/questionnaire'
import QuestionnaireForm from '@/components/QuestionnaireForm'

export default async function ReportPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: report } = await supabase
    .from('reports')
    .select('id, name, user_id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!report) notFound()

  const { data: rawResponses } = await supabase
    .from('report_responses')
    .select('item_id, resultado, observaciones')
    .eq('report_id', params.id)

  const responses: Record<string, Resultado> = {}
  const observaciones: Record<string, string> = {}
  ;(rawResponses ?? []).forEach(r => {
    responses[r.item_id] = r.resultado as Resultado
    observaciones[r.item_id] = r.observaciones ?? ''
  })

  const { porcentaje, aprobados, total, na } = calcularPorcentaje(responses)

  return (
    <div>
      {/* Header del reporte */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-gray-500 mb-1">Reporte QA</p>
            <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
          </div>

          {/* Score badge */}
          <div className={`rounded-xl px-6 py-3 text-center min-w-[120px] ${
            porcentaje === null
              ? 'bg-gray-100'
              : porcentaje >= 80
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`text-3xl font-bold ${
              porcentaje === null ? 'text-gray-400' : porcentaje >= 80 ? 'text-green-600' : 'text-red-500'
            }`}>
              {porcentaje !== null ? `${porcentaje}%` : '—'}
            </div>
            <div className={`text-xs font-semibold mt-0.5 ${
              porcentaje === null ? 'text-gray-400' : porcentaje >= 80 ? 'text-green-700' : 'text-red-600'
            }`}>
              {porcentaje === null ? 'Sin completar' : porcentaje >= 80 ? 'APROBADO' : 'NO APROBADO'}
            </div>
            {porcentaje !== null && (
              <div className="text-xs text-gray-400 mt-1">{aprobados}/{total} ítems · {na} N/A</div>
            )}
          </div>
        </div>
      </div>

      {/* Formulario del cuestionario */}
      <QuestionnaireForm
        reportId={params.id}
        sections={SECTIONS}
        initialResponses={responses}
        initialObservaciones={observaciones}
      />
    </div>
  )
}
