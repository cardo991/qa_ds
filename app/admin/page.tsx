import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calcularPorcentaje } from '@/lib/questionnaire'
import type { Resultado } from '@/lib/questionnaire'
import Link from 'next/link'

const ADMIN_EMAIL = 'lcscardozo2@gmail.com'

export default async function AdminPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const { data: reports } = await supabase
    .from('reports')
    .select('id, name, updated_at, user_id')
    .order('updated_at', { ascending: false })

  const { data: allResponses } = await supabase
    .from('report_responses')
    .select('report_id, item_id, resultado')
    .in('report_id', (reports ?? []).map(r => r.id))

  // Get user emails via auth admin — fallback to user_id display
  const userIds = [...new Set((reports ?? []).map(r => r.user_id))]

  const reportStats = (reports ?? []).map(report => {
    const responses: Record<string, Resultado> = {}
    ;(allResponses ?? [])
      .filter(r => r.report_id === report.id)
      .forEach(r => { responses[r.item_id] = r.resultado as Resultado })
    const { porcentaje, aprobados, total } = calcularPorcentaje(responses)
    return { ...report, porcentaje, aprobados, total, aprobado: porcentaje !== null && porcentaje >= 80 }
  })

  const totalReports = reportStats.length
  const totalAprobados = reportStats.filter(r => r.aprobado).length
  const totalSinCompletar = reportStats.filter(r => r.porcentaje === null).length
  const avgPct = reportStats.filter(r => r.porcentaje !== null).reduce((acc, r) => acc + (r.porcentaje ?? 0), 0) / (reportStats.filter(r => r.porcentaje !== null).length || 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-ypf-blue text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-white/70 hover:text-white text-sm">← Dashboard</Link>
          <span className="text-white/40">|</span>
          <span className="font-semibold text-sm">Admin — Todos los reportes</span>
        </div>
        <Link href="/admin/stats" className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
          Ver estadísticas →
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total reportes', value: totalReports, color: 'text-gray-900' },
            { label: 'Aprobados', value: totalAprobados, color: 'text-green-600' },
            { label: 'Sin completar', value: totalSinCompletar, color: 'text-gray-400' },
            { label: '% promedio', value: `${Math.round(avgPct)}%`, color: 'text-ypf-blue' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
              <div className="text-xs text-gray-400 mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {/* Tabla de reportes */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="font-semibold text-gray-700 text-sm">Reportes de todos los usuarios</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {reportStats.map(report => (
              <div key={report.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{report.name}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(report.updated_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}<span className="font-mono text-gray-300">{report.user_id.slice(0, 8)}…</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {report.porcentaje !== null && (
                    <span className={`text-sm font-bold ${report.aprobado ? 'text-green-600' : 'text-red-500'}`}>
                      {report.porcentaje}%
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    report.porcentaje === null ? 'bg-gray-100 text-gray-400'
                    : report.aprobado ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-600'
                  }`}>
                    {report.porcentaje === null ? 'Sin completar' : report.aprobado ? 'Aprobado' : 'No aprobado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
