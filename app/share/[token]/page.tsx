import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SECTIONS, calcularPorcentaje } from '@/lib/questionnaire'
import type { Resultado } from '@/lib/questionnaire'
import DownloadButtons from '@/components/DownloadButtons'

export default async function SharePage({ params }: { params: { token: string } }) {
  const supabase = createClient()

  const { data: report } = await supabase
    .from('reports')
    .select('id, name, comment, is_final, share_token')
    .eq('share_token', params.token)
    .single()

  if (!report) notFound()

  const { data: rawResponses } = await supabase
    .from('report_responses')
    .select('item_id, resultado, observaciones')
    .eq('report_id', report.id)

  const responses: Record<string, Resultado> = {}
  const observaciones: Record<string, string> = {}
  ;(rawResponses ?? []).forEach(r => {
    responses[r.item_id] = r.resultado as Resultado
    observaciones[r.item_id] = r.observaciones ?? ''
  })

  const { porcentaje, aprobados, total, na } = calcularPorcentaje(responses)

  const RESULTADO_STYLE: Record<string, string> = {
    aprobado: 'bg-green-100 text-green-700',
    no_aprobado: 'bg-red-100 text-red-600',
    na: 'bg-gray-100 text-gray-500',
  }
  const RESULTADO_LABEL: Record<string, string> = {
    aprobado: '✅ Aprobado',
    no_aprobado: '❌ No aprobado',
    na: '➖ N/A',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <div className="bg-ypf-blue text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-semibold text-sm">Visual QA — Célula DS</span>
        </div>
        <span className="text-xs bg-white/20 px-2 py-1 rounded">Vista de solo lectura</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <p className="text-sm text-gray-500 mb-1">Reporte QA</p>
            <h1 className="text-2xl font-bold text-gray-900">{report.name}</h1>
            {report.is_final && (
              <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-ypf-blue text-white">✓ Final</span>
            )}
          </div>
          <div className="flex items-start gap-3 flex-wrap">
            <DownloadButtons reportName={report.name} sections={SECTIONS} responses={responses} observaciones={observaciones} />
            <div className={`rounded-xl px-5 py-3 text-center min-w-[110px] ${
              porcentaje === null ? 'bg-gray-100'
              : porcentaje >= 80 ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
            }`}>
              <div className={`text-3xl font-bold ${porcentaje === null ? 'text-gray-400' : porcentaje >= 80 ? 'text-green-600' : 'text-red-500'}`}>
                {porcentaje !== null ? `${porcentaje}%` : '—'}
              </div>
              <div className={`text-xs font-semibold mt-0.5 ${porcentaje === null ? 'text-gray-400' : porcentaje >= 80 ? 'text-green-700' : 'text-red-600'}`}>
                {porcentaje === null ? 'Sin completar' : porcentaje >= 80 ? 'APROBADO' : 'NO APROBADO'}
              </div>
              {porcentaje !== null && <div className="text-xs text-gray-400 mt-1">{aprobados}/{total} · {na} N/A</div>}
            </div>
          </div>
        </div>

        {/* Secciones */}
        <div className="space-y-6">
          {SECTIONS.map(section => (
            <div key={section.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-ypf-lightblue px-5 py-3 border-b border-gray-200">
                <h2 className="font-semibold text-ypf-dark text-sm">{section.title}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {section.items.map(item => {
                  const res = responses[item.id]
                  const obs = observaciones[item.id]
                  return (
                    <div key={item.id} className="p-5">
                      <div className="flex gap-3">
                        <span className="shrink-0 text-xs font-bold text-ypf-blue bg-ypf-lightblue px-2 py-0.5 rounded h-fit">
                          {item.displayId}
                        </span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">{item.tipo} · {item.aspecto}</p>
                          <p className="text-sm text-gray-800 font-medium mb-1">{item.validar}</p>
                          <p className="text-xs text-gray-500 mb-3"><span className="font-semibold">Criterio:</span> {item.criterio}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${res ? RESULTADO_STYLE[res] : 'bg-gray-100 text-gray-400'}`}>
                              {res ? RESULTADO_LABEL[res] : '— Sin respuesta'}
                            </span>
                            {obs && <span className="text-xs text-gray-500 italic">"{obs}"</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Comentario general */}
        {report.comment && (
          <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
            <h3 className="font-semibold text-gray-800 mb-2 text-sm">Comentario general</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{report.comment}</p>
          </div>
        )}
      </div>
    </div>
  )
}
