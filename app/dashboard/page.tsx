import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { calcularPorcentaje } from '@/lib/questionnaire'
import type { Resultado } from '@/lib/questionnaire'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: reports } = await supabase
    .from('reports')
    .select('id, name, created_at, updated_at')
    .eq('user_id', user!.id)
    .order('updated_at', { ascending: false })

  const { data: allResponses } = await supabase
    .from('report_responses')
    .select('report_id, item_id, resultado')
    .in('report_id', (reports ?? []).map(r => r.id))

  function getStats(reportId: string) {
    const responses: Record<string, Resultado> = {}
    ;(allResponses ?? [])
      .filter(r => r.report_id === reportId)
      .forEach(r => { responses[r.item_id] = r.resultado as Resultado })
    return calcularPorcentaje(responses)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Reportes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Revisiones QA de tableros Power BI</p>
        </div>
        <Link
          href="/dashboard/reports/new"
          className="bg-ypf-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-ypf-dark transition-colors"
        >
          + Nuevo reporte
        </Link>
      </div>

      {(!reports || reports.length === 0) ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium">Todavía no tenés reportes</p>
          <p className="text-sm mt-1">Creá tu primer reporte haciendo click en "Nuevo reporte"</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map(report => {
            const { porcentaje, aprobados, total, na } = getStats(report.id)
            const aprobado = porcentaje !== null && porcentaje >= 80
            const enProgreso = porcentaje === null && total === 0

            return (
              <Link key={report.id} href={`/dashboard/reports/${report.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-ypf-blue transition-all cursor-pointer">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="font-semibold text-gray-900 truncate">{report.name}</h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Actualizado: {new Date(report.updated_at).toLocaleDateString('es-AR', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {!enProgreso && porcentaje !== null && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${aprobado ? 'text-green-600' : 'text-red-500'}`}>
                            {porcentaje}%
                          </div>
                          <div className="text-xs text-gray-400">{aprobados}/{total} ítems</div>
                        </div>
                      )}
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        enProgreso
                          ? 'bg-gray-100 text-gray-500'
                          : aprobado
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                      }`}>
                        {enProgreso ? 'Sin completar' : aprobado ? 'Aprobado' : 'No aprobado'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
