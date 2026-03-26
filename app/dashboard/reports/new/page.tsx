'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function NewReportPage() {
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data, error } = await supabase
      .from('reports')
      .insert({ name: name.trim(), user_id: user.id })
      .select('id')
      .single()

    if (error || !data) {
      setError('Error al crear el reporte. Intentá de nuevo.')
      setLoading(false)
    } else {
      router.push(`/dashboard/reports/${data.id}`)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Nuevo reporte</h1>
      <p className="text-gray-500 text-sm mb-8">Ingresá el nombre del tablero a revisar</p>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del reporte
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
              placeholder="Ej: Dashboard Ventas — Enero 2026"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ypf-blue focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-ypf-blue text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-ypf-dark transition-colors disabled:opacity-60"
            >
              {loading ? 'Creando...' : 'Crear y completar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
