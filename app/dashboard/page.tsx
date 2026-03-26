import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { calcularPorcentaje } from '@/lib/questionnaire'
import type { Resultado } from '@/lib/questionnaire'
import ReportsList from '@/components/ReportsList'

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

  const reportStats = (reports ?? []).map(report => {
    const responses: Record<string, Resultado> = {}
    ;(allResponses ?? [])
      .filter(r => r.report_id === report.id)
      .forEach(r => { responses[r.item_id] = r.resultado as Resultado })
    const { porcentaje, aprobados, total } = calcularPorcentaje(responses)
    return {
      id: report.id,
      name: report.name,
      updated_at: report.updated_at,
      porcentaje,
      aprobados,
      total,
      aprobado: porcentaje !== null && porcentaje >= 80,
    }
  })

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

      <ReportsList reports={reportStats} />
    </div>
  )
}
