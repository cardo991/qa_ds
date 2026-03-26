'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { QASection, Resultado } from '@/lib/questionnaire'
import { calcularPorcentaje } from '@/lib/questionnaire'

interface Props {
  reportId: string
  sections: QASection[]
  initialResponses: Record<string, Resultado>
  initialObservaciones: Record<string, string>
  initialComment?: string
}

const RESULTADO_LABELS: Record<Resultado, { label: string; color: string; selected: string }> = {
  aprobado: {
    label: '✅ Aprobado',
    color: 'border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-700',
    selected: 'border-green-500 bg-green-50 text-green-700 font-semibold',
  },
  no_aprobado: {
    label: '❌ No aprobado',
    color: 'border-gray-200 text-gray-600 hover:border-red-400 hover:text-red-700',
    selected: 'border-red-500 bg-red-50 text-red-700 font-semibold',
  },
  na: {
    label: '➖ N/A',
    color: 'border-gray-200 text-gray-500 hover:border-gray-400',
    selected: 'border-gray-400 bg-gray-100 text-gray-600 font-semibold',
  },
}

export default function QuestionnaireForm({ reportId, sections, initialResponses, initialObservaciones, initialComment = '' }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [responses, setResponses] = useState<Record<string, Resultado>>(initialResponses)
  const [observaciones, setObservaciones] = useState<Record<string, string>>(initialObservaciones)
  const [comment, setComment] = useState(initialComment)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const { porcentaje, aprobados, total, na } = calcularPorcentaje(responses)

  function setRespuesta(itemId: string, val: Resultado) {
    setResponses(prev => ({ ...prev, [itemId]: val }))
    setSaveStatus('idle')
  }

  function setObs(itemId: string, val: string) {
    setObservaciones(prev => ({ ...prev, [itemId]: val }))
    setSaveStatus('idle')
  }

  async function handleSave() {
    setSaving(true)
    setSaveStatus('idle')
    setErrorMsg('')

    const allItems = sections.flatMap(s => s.items)

    const upserts = allItems
      .filter(item => responses[item.id] !== undefined)
      .map(item => ({
        report_id: reportId,
        item_id: item.id,
        resultado: responses[item.id],
        observaciones: observaciones[item.id] ?? '',
        updated_at: new Date().toISOString(),
      }))

    if (upserts.length === 0) {
      setSaving(false)
      setSaveStatus('error')
      setErrorMsg('No hay respuestas para guardar. Seleccioná al menos un ítem.')
      return
    }

    const { error: upsertError } = await supabase
      .from('report_responses')
      .upsert(upserts, { onConflict: 'report_id,item_id' })

    if (upsertError) {
      setSaving(false)
      setSaveStatus('error')
      setErrorMsg(`Error: ${upsertError.message}`)
      return
    }

    await supabase
      .from('reports')
      .update({ updated_at: new Date().toISOString(), comment })
      .eq('id', reportId)

    // Guardar snapshot de versión
    const { porcentaje: pct } = calcularPorcentaje(responses)
    await supabase.from('report_versions').insert({
      report_id: reportId,
      snapshot: responses,
      porcentaje: pct,
    })

    setSaving(false)
    setSaveStatus('saved')
    router.refresh()
  }

  const totalItems = sections.flatMap(s => s.items).length
  const completedCount = Object.keys(responses).length

  return (
    <div>
      {/* Progress bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 font-medium">
            Progreso: {completedCount}/{totalItems} ítems completados
          </span>
          {porcentaje !== null && (
            <span className={`text-sm font-semibold ${porcentaje >= 80 ? 'text-green-600' : 'text-red-500'}`}>
              {aprobados} aprobados · {total - aprobados} no aprobados · {na} N/A
            </span>
          )}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-ypf-blue h-2 rounded-full transition-all"
            style={{ width: `${(completedCount / totalItems) * 100}%` }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        {sections.map(section => (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="bg-ypf-lightblue px-5 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-ypf-dark text-sm">{section.title}</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {section.items.map(item => {
                const current = responses[item.id]
                return (
                  <div key={item.id} className="p-5">
                    <div className="flex gap-3 mb-3">
                      <span className="shrink-0 text-xs font-bold text-ypf-blue bg-ypf-lightblue px-2 py-0.5 rounded">
                        {item.displayId}
                      </span>
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                          {item.tipo} · {item.aspecto}
                        </p>
                        <p className="text-sm text-gray-800 font-medium">{item.validar}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">Criterio:</span> {item.criterio}
                        </p>
                      </div>
                    </div>

                    {/* Resultado buttons */}
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {(['aprobado', 'no_aprobado', 'na'] as Resultado[]).map(val => {
                        const style = RESULTADO_LABELS[val]
                        const isSelected = current === val
                        return (
                          <button
                            key={val}
                            onClick={() => setRespuesta(item.id, val)}
                            className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                              isSelected ? style.selected : style.color
                            }`}
                          >
                            {style.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Observaciones */}
                    <textarea
                      value={observaciones[item.id] ?? ''}
                      onChange={e => setObs(item.id, e.target.value)}
                      placeholder="Observaciones (opcional)..."
                      rows={2}
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-ypf-blue focus:border-transparent"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Comentario general */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Comentario general del reporte</h3>
        <textarea
          value={comment}
          onChange={e => { setComment(e.target.value); setSaveStatus('idle') }}
          placeholder="Observaciones generales, conclusiones, próximos pasos..."
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-ypf-blue"
        />
      </div>

      {/* Save footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-6 -mx-4 px-4 py-3 flex items-center justify-between gap-4">
        <div className="text-sm">
          {saveStatus === 'saved' && <span className="text-green-600 font-medium">✓ Guardado correctamente</span>}
          {saveStatus === 'error' && <span className="text-red-500">{errorMsg}</span>}
          {saveStatus === 'idle' && <span className="text-gray-400">Hacé click en Guardar para registrar tus respuestas</span>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-ypf-blue text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-ypf-dark transition-colors disabled:opacity-60 shrink-0"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
