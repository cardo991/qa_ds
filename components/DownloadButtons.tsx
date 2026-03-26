'use client'

import { useState } from 'react'
import type { QASection, Resultado } from '@/lib/questionnaire'
import { calcularPorcentaje } from '@/lib/questionnaire'

interface Props {
  reportName: string
  sections: QASection[]
  responses: Record<string, Resultado>
  observaciones: Record<string, string>
}

const RESULTADO_LABEL: Record<string, string> = {
  aprobado: 'Aprobado',
  no_aprobado: 'No aprobado',
  na: 'N/A',
}

export default function DownloadButtons({ reportName, sections, responses, observaciones }: Props) {
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null)

  const { porcentaje, aprobados, total, na } = calcularPorcentaje(responses)
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const estado = porcentaje === null ? 'Sin completar' : porcentaje >= 80 ? 'APROBADO' : 'NO APROBADO'

  async function downloadExcel() {
    setLoading('excel')
    const XLSX = (await import('xlsx')).default

    const rows: unknown[][] = [
      ['Visual QA — Célula DS'],
      ['Reporte:', reportName],
      ['Fecha:', fecha],
      ['Resultado:', estado],
      ['% Aprobación:', porcentaje !== null ? `${porcentaje}%` : '—'],
      ['Aprobados:', aprobados],
      ['Total evaluados:', total],
      ['N/A:', na],
      [],
      ['ID', 'Sección', 'Tipo', 'Aspecto', 'Pregunta', 'Criterio', 'Resultado', 'Observaciones'],
    ]

    sections.forEach(section => {
      section.items.forEach(item => {
        rows.push([
          item.displayId,
          section.title,
          item.tipo,
          item.aspecto,
          item.validar,
          item.criterio,
          RESULTADO_LABEL[responses[item.id]] ?? '—',
          observaciones[item.id] ?? '',
        ])
      })
    })

    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 25 }, { wch: 22 }, { wch: 55 }, { wch: 40 }, { wch: 15 }, { wch: 35 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'QA')
    XLSX.writeFile(wb, `QA_${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`)
    setLoading(null)
  }

  async function downloadPDF() {
    setLoading('pdf')
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Header
    doc.setFillColor(0, 101, 189)
    doc.rect(0, 0, 297, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Visual QA — Célula DS', 10, 10)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(reportName, 10, 17)

    // Stats row
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(9)
    doc.text(`Fecha: ${fecha}`, 10, 30)
    doc.text(`Resultado: ${estado}`, 80, 30)
    doc.text(`Aprobación: ${porcentaje !== null ? porcentaje + '%' : '—'}  |  Aprobados: ${aprobados}/${total}  |  N/A: ${na}`, 160, 30)

    // Table
    const tableRows = sections.flatMap(section =>
      section.items.map(item => [
        item.displayId,
        section.title.replace(/^\d+\.\s*/, ''),
        item.aspecto,
        item.validar.length > 70 ? item.validar.slice(0, 68) + '…' : item.validar,
        RESULTADO_LABEL[responses[item.id]] ?? '—',
        (observaciones[item.id] ?? '').slice(0, 60),
      ])
    )

    autoTable(doc, {
      startY: 35,
      head: [['ID', 'Sección', 'Aspecto', 'Pregunta', 'Resultado', 'Observaciones']],
      body: tableRows,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [0, 101, 189], textColor: 255, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 90 },
        4: { cellWidth: 25 },
        5: { cellWidth: 55 },
      },
      alternateRowStyles: { fillColor: [232, 241, 251] },
      didParseCell: (data) => {
        if (data.column.index === 4 && data.section === 'body') {
          const val = data.cell.raw as string
          if (val === 'Aprobado') data.cell.styles.textColor = [22, 163, 74]
          else if (val === 'No aprobado') data.cell.styles.textColor = [220, 38, 38]
          else data.cell.styles.textColor = [107, 114, 128]
        }
      },
    })

    doc.save(`QA_${reportName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`)
    setLoading(null)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={downloadExcel}
        disabled={loading !== null}
        className="flex items-center gap-1.5 border border-green-600 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-green-50 transition-colors disabled:opacity-50"
      >
        {loading === 'excel' ? '...' : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Excel
          </>
        )}
      </button>
      <button
        onClick={downloadPDF}
        disabled={loading !== null}
        className="flex items-center gap-1.5 border border-red-500 text-red-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {loading === 'pdf' ? '...' : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            PDF
          </>
        )}
      </button>
    </div>
  )
}
