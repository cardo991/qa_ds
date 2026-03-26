'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type FilterState = 'todos' | 'aprobado' | 'no_aprobado' | 'sin_completar'
type SortState = 'fecha' | 'porcentaje_desc' | 'porcentaje_asc' | 'nombre'

interface ReportStat {
  id: string
  name: string
  updated_at: string
  porcentaje: number | null
  aprobados: number
  total: number
  aprobado: boolean
}

export default function ReportsList({ reports }: { reports: ReportStat[] }) {
  const router = useRouter()
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterState>('todos')
  const [sort, setSort] = useState<SortState>('fecha')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)

  const filtered = reports
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    .filter(r => {
      if (filter === 'aprobado') return r.porcentaje !== null && r.aprobado
      if (filter === 'no_aprobado') return r.porcentaje !== null && !r.aprobado
      if (filter === 'sin_completar') return r.porcentaje === null
      return true
    })
    .sort((a, b) => {
      if (sort === 'porcentaje_desc') return (b.porcentaje ?? -1) - (a.porcentaje ?? -1)
      if (sort === 'porcentaje_asc') return (a.porcentaje ?? 101) - (b.porcentaje ?? 101)
      if (sort === 'nombre') return a.name.localeCompare(b.name)
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })

  async function handleDelete(id: string) {
    setDeleting(id)
    await supabase.from('reports').delete().eq('id', id)
    setConfirmId(null)
    setDeleting(null)
    router.refresh()
  }

  async function handleDuplicate(report: ReportStat) {
    setDuplicating(report.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: newReport } = await supabase
      .from('reports')
      .insert({ name: `Copia de ${report.name}`, user_id: user.id })
      .select('id').single()

    if (newReport) {
      const { data: responses } = await supabase
        .from('report_responses')
        .select('item_id, resultado, observaciones')
        .eq('report_id', report.id)

      if (responses && responses.length > 0) {
        await supabase.from('report_responses').insert(
          responses.map(r => ({ ...r, report_id: newReport.id }))
        )
      }
    }
    setDuplicating(null)
    router.refresh()
  }

  const filterButtons: { key: FilterState; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'aprobado', label: '✅ Aprobados' },
    { key: 'no_aprobado', label: '❌ No aprobados' },
    { key: 'sin_completar', label: '⏳ Sin completar' },
  ]

  return (
    <div>
      {/* Buscador */}
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar reporte..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ypf-blue"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      {/* Filtros y orden */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {filterButtons.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filter === f.key
                  ? 'bg-ypf-blue text-white border-ypf-blue'
                  : 'border-gray-200 text-gray-600 hover:border-ypf-blue hover:text-ypf-blue'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortState)}
          className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-ypf-blue"
        >
          <option value="fecha">Ordenar: Más reciente</option>
          <option value="porcentaje_desc">Ordenar: Mayor %</option>
          <option value="porcentaje_asc">Ordenar: Menor %</option>
          <option value="nombre">Ordenar: Nombre A-Z</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {search ? `No hay reportes que coincidan con "${search}"` : 'Todavía no tenés reportes'}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map(report => (
            <div key={report.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-ypf-blue transition-all">
              <div className="flex items-center gap-3 p-5">
                {/* Link al reporte */}
                <Link href={`/dashboard/reports/${report.id}`} className="flex-1 flex items-start justify-between gap-4 min-w-0">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 truncate">{report.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Actualizado: {new Date(report.updated_at).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {report.porcentaje !== null && (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${report.aprobado ? 'text-green-600' : 'text-red-500'}`}>
                          {report.porcentaje}%
                        </div>
                        <div className="text-xs text-gray-400">{report.aprobados}/{report.total} ítems</div>
                      </div>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      report.porcentaje === null
                        ? 'bg-gray-100 text-gray-500'
                        : report.aprobado
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                    }`}>
                      {report.porcentaje === null ? 'Sin completar' : report.aprobado ? 'Aprobado' : 'No aprobado'}
                    </span>
                  </div>
                </Link>

                {/* Botón duplicar */}
                <button
                  onClick={() => handleDuplicate(report)}
                  disabled={duplicating === report.id}
                  className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-ypf-blue hover:bg-ypf-lightblue transition-colors disabled:opacity-40"
                  title="Duplicar reporte"
                >
                  {duplicating === report.id ? (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>

                {/* Botón eliminar */}
                <button
                  onClick={() => setConfirmId(report.id)}
                  className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Eliminar reporte"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmación */}
      {confirmId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-2">¿Eliminar reporte?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción no se puede deshacer. Se eliminarán el reporte y todas sus respuestas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmId(null)}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(confirmId)}
                disabled={deleting === confirmId}
                className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-600 disabled:opacity-60"
              >
                {deleting === confirmId ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
