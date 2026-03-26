interface Version {
  id: string
  porcentaje: number | null
  created_at: string
  label: string
}

export default function VersionHistory({ versions }: { versions: Version[] }) {
  if (versions.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 mt-6">
      <h3 className="font-semibold text-gray-800 mb-4 text-sm">Historial de guardados</h3>
      <div className="relative">
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200" />
        <div className="space-y-3">
          {versions.map((v, i) => {
            const pct = v.porcentaje
            const aprobado = pct !== null && pct >= 80
            return (
              <div key={v.id} className="flex items-center gap-3 pl-8 relative">
                <div className={`absolute left-2 w-3 h-3 rounded-full border-2 ${
                  i === 0 ? 'border-ypf-blue bg-ypf-blue' : 'border-gray-300 bg-white'
                }`} />
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-gray-400 w-36 shrink-0">
                    {new Date(v.created_at).toLocaleDateString('es-AR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  {pct !== null ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {pct}% — {aprobado ? 'Aprobado' : 'No aprobado'}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Sin completar</span>
                  )}
                  {i === 0 && <span className="text-xs text-ypf-blue font-medium">← actual</span>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
