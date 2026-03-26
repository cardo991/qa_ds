'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  reportId: string
  reportName: string
  isFinal: boolean
  shareToken: string
  porcentaje: number | null
  aprobados: number
  total: number
  na: number
}

export default function ReportHeader({ reportId, reportName, isFinal, shareToken, porcentaje, aprobados, total, na }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [name, setName] = useState(reportName)
  const [editing, setEditing] = useState(false)
  const [savingName, setSavingName] = useState(false)
  const [final, setFinal] = useState(isFinal)
  const [savingFinal, setSavingFinal] = useState(false)
  const [copied, setCopied] = useState(false)

  async function saveName() {
    if (!name.trim() || name === reportName) { setEditing(false); return }
    setSavingName(true)
    await supabase.from('reports').update({ name: name.trim() }).eq('id', reportId)
    setSavingName(false)
    setEditing(false)
    router.refresh()
  }

  async function toggleFinal() {
    setSavingFinal(true)
    const newVal = !final
    await supabase.from('reports').update({ is_final: newVal }).eq('id', reportId)
    setFinal(newVal)
    setSavingFinal(false)
    router.refresh()
  }

  function copyShareLink() {
    const url = `${window.location.origin}/share/${shareToken}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-1">Reporte QA</p>

          {/* Nombre editable */}
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setName(reportName); setEditing(false) } }}
                className="text-2xl font-bold text-gray-900 border-b-2 border-ypf-blue bg-transparent outline-none w-full"
              />
              {savingName && <span className="text-xs text-gray-400">Guardando...</span>}
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{name}</h1>
              <button
                onClick={() => setEditing(true)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-ypf-blue transition-all"
                title="Editar nombre"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          )}

          {/* Badges */}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {final && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ypf-blue text-white">
                ✓ Final
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 flex-wrap">
          {/* Botón compartir */}
          <button
            onClick={copyShareLink}
            className="flex items-center gap-1.5 border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? '¡Copiado!' : 'Compartir'}
          </button>

          {/* Botón Final */}
          <button
            onClick={toggleFinal}
            disabled={savingFinal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-60 ${
              final
                ? 'bg-ypf-blue text-white border-ypf-blue hover:bg-ypf-dark'
                : 'border-ypf-blue text-ypf-blue hover:bg-ypf-lightblue'
            }`}
          >
            {savingFinal ? '...' : final ? '✓ Marcado como Final' : 'Marcar como Final'}
          </button>

          {/* Score */}
          <div className={`rounded-xl px-5 py-3 text-center min-w-[110px] ${
            porcentaje === null ? 'bg-gray-100'
            : porcentaje >= 80 ? 'bg-green-50 border border-green-200'
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
              <div className="text-xs text-gray-400 mt-1">{aprobados}/{total} · {na} N/A</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
