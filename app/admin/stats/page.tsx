import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ALL_ITEMS } from '@/lib/questionnaire'
import Link from 'next/link'

const ADMIN_EMAIL = 'lcscardozo2@gmail.com'

export default async function StatsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const { data: allResponses } = await supabase
    .from('report_responses')
    .select('item_id, resultado')

  // Calcular tasas por ítem
  const itemStats = ALL_ITEMS.map(item => {
    const itemResponses = (allResponses ?? []).filter(r => r.item_id === item.id)
    const aprobados = itemResponses.filter(r => r.resultado === 'aprobado').length
    const noAprobados = itemResponses.filter(r => r.resultado === 'no_aprobado').length
    const na = itemResponses.filter(r => r.resultado === 'na').length
    const evaluados = aprobados + noAprobados
    const tasaFallo = evaluados > 0 ? Math.round((noAprobados / evaluados) * 100) : null
    return { item, aprobados, noAprobados, na, evaluados, tasaFallo }
  })

  const sorted = [...itemStats].sort((a, b) => (b.tasaFallo ?? -1) - (a.tasaFallo ?? -1))
  const topFallos = sorted.filter(s => s.tasaFallo !== null).slice(0, 10)
  const maxFallo = Math.max(...topFallos.map(s => s.tasaFallo ?? 0), 1)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-ypf-blue text-white px-6 py-4 flex items-center gap-3">
        <Link href="/admin" className="text-white/70 hover:text-white text-sm">← Admin</Link>
        <span className="text-white/40">|</span>
        <span className="font-semibold text-sm">Estadísticas globales — Ítems que más fallan</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Resumen general */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total respuestas', value: (allResponses ?? []).length },
            { label: 'Ítems evaluados', value: itemStats.filter(s => s.evaluados > 0).length },
            { label: 'Ítem más fallido', value: topFallos[0] ? `${topFallos[0].tasaFallo}% fallo` : '—' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{k.value}</div>
              <div className="text-xs text-gray-400 mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        {topFallos.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
            Todavía no hay suficientes datos para mostrar estadísticas.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
              <h2 className="font-semibold text-gray-700 text-sm">Top ítems con mayor tasa de No Aprobado</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {topFallos.map(({ item, aprobados, noAprobados, evaluados, tasaFallo }) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="flex items-start gap-3 mb-2">
                    <span className="shrink-0 text-xs font-bold text-ypf-blue bg-ypf-lightblue px-2 py-0.5 rounded">
                      {item.displayId}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.aspecto}</p>
                      <p className="text-xs text-gray-400 truncate">{item.validar}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-lg font-bold text-red-500">{tasaFallo}%</span>
                      <p className="text-xs text-gray-400">{noAprobados}/{evaluados} fallos</p>
                    </div>
                  </div>
                  {/* Barra */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-red-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${((tasaFallo ?? 0) / maxFallo) * 100}%` }}
                    />
                  </div>
                  <div className="flex gap-4 mt-1.5">
                    <span className="text-xs text-green-600">{aprobados} aprobados</span>
                    <span className="text-xs text-red-500">{noAprobados} no aprobados</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
