import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { SECTIONS, calcularPorcentaje } from '@/lib/questionnaire'
import type { Resultado } from '@/lib/questionnaire'
import QuestionnaireForm from '@/components/QuestionnaireForm'
import DownloadButtons from '@/components/DownloadButtons'
import ReportHeader from '@/components/ReportHeader'
import VersionHistory from '@/components/VersionHistory'

export default async function ReportPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: report } = await supabase
    .from('reports')
    .select('id, name, user_id, comment, is_final, share_token')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!report) notFound()

  const [{ data: rawResponses }, { data: versions }] = await Promise.all([
    supabase.from('report_responses').select('item_id, resultado, observaciones').eq('report_id', params.id),
    supabase.from('report_versions').select('id, porcentaje, created_at, label').eq('report_id', params.id).order('created_at', { ascending: false }).limit(10),
  ])

  const responses: Record<string, Resultado> = {}
  const observaciones: Record<string, string> = {}
  ;(rawResponses ?? []).forEach(r => {
    responses[r.item_id] = r.resultado as Resultado
    observaciones[r.item_id] = r.observaciones ?? ''
  })

  const { porcentaje, aprobados, total, na } = calcularPorcentaje(responses)

  return (
    <div>
      <ReportHeader
        reportId={report.id}
        reportName={report.name}
        isFinal={report.is_final ?? false}
        shareToken={report.share_token ?? ''}
        porcentaje={porcentaje}
        aprobados={aprobados}
        total={total}
        na={na}
      />

      <div className="flex justify-end mb-4">
        <DownloadButtons
          reportName={report.name}
          sections={SECTIONS}
          responses={responses}
          observaciones={observaciones}
        />
      </div>

      <QuestionnaireForm
        reportId={params.id}
        sections={SECTIONS}
        initialResponses={responses}
        initialObservaciones={observaciones}
        initialComment={report.comment ?? ''}
      />

      <VersionHistory versions={versions ?? []} />
    </div>
  )
}
