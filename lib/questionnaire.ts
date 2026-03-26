export type Resultado = 'aprobado' | 'no_aprobado' | 'na'

export interface QAItem {
  id: string
  tipo: string
  aspecto: string
  validar: string
  criterio: string
}

export interface QASection {
  title: string
  items: QAItem[]
}

export const SECTIONS: QASection[] = [
  {
    title: '1. Configuración y Adopción del Sistema',
    items: [
      {
        id: '1',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Uso del Template Base',
        validar: '¿El tablero fue iniciado desde el archivo .PBIT o .PBIX de Template DS más reciente?',
        criterio: 'Debe usar el template base oficial del DS.',
      },
      {
        id: '2',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Aplicación de Tema',
        validar: '¿Se aplicó el JSON Theme oficial del DS y no hay sobreescrituras de colores por fuera de la paleta?',
        criterio: 'No debe haber colores fuera de la paleta del DS.',
      },
      {
        id: '3',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Fuentes Instaladas',
        validar: '¿La tipografía principal está instalada y usada correctamente en todos los textos?',
        criterio: 'La tipografía es DIN.',
      },
      {
        id: '4',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Identidad de Marca',
        validar: '¿El logo de YPF está en la posición y tamaño estándar, y es visible en todas las páginas?',
        criterio: 'Parte superior derecha (Qlik). Parte superior izquierda (PBI).',
      },
    ],
  },
  {
    title: '2.1. Jerarquía Visual — Gráficos',
    items: [
      {
        id: '2.1.a',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Títulos',
        validar: '¿Se usa el estilo de tipografía definido para Títulos?',
        criterio: 'DIN Bold 12.',
      },
      {
        id: '2.1.b',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Subtítulos',
        validar: '¿Se usa el estilo de tipografía definido para Subtítulos?',
        criterio: 'DIN Regular 10.',
      },
      {
        id: '2.1.c',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Leyendas / Referencias',
        validar: '¿Se usa el estilo de tipografía definido para Leyendas?',
        criterio: 'DIN Regular 9.',
      },
      {
        id: '2.1.d',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Colores',
        validar: '¿Los gráficos utilizan los presets de color y leyenda del DS (no colores fuera de la paleta)?',
        criterio: 'Solo colores del preset oficial del DS.',
      },
    ],
  },
  {
    title: '2.2. Jerarquía Visual — KPIs',
    items: [
      {
        id: '2.2.a',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Títulos',
        validar: '¿Se usa el estilo de tipografía definido para Títulos?',
        criterio: 'DIN Bold 10.',
      },
      {
        id: '2.2.b',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Valores',
        validar: '¿Se usa el estilo de tipografía para Valores?',
        criterio: 'DIN Bold 22.',
      },
      {
        id: '2.2.c',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Sub KPIs',
        validar: '¿Se usa el estilo de tipografía definido para Sub KPIs?',
        criterio: 'DIN Regular 10.',
      },
      {
        id: '2.2.d',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Colores',
        validar: '¿Los KPI Cards utilizan el diseño estándar (valor principal color #0065BD + variación ▲/▼ con color semántico)?',
        criterio: 'Valor principal en #0065BD, variaciones con color semántico (rojo/verde).',
      },
    ],
  },
  {
    title: '2.3. Márgenes, Espaciado y Filtros',
    items: [
      {
        id: '3.2',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Márgenes y Espaciado General',
        validar: '¿El espaciado entre los elementos (gráficos, cards, filtros) es consistente (20px según la grilla)?',
        criterio: 'Espaciado consistente de 20px según la grilla del DS.',
      },
      {
        id: '4.2',
        tipo: 'Revisión Visual Estática',
        aspecto: 'Filtros / Segmentadores',
        validar: '¿Los filtros de segmentación están ubicados en la zona estándar (barra lateral derecha o extremo izquierdo superior) y usan el estilo del DS?',
        criterio: 'Posición estándar y estilo del DS aplicado.',
      },
    ],
  },
  {
    title: '4. Legibilidad y Formato de Datos',
    items: [
      {
        id: '4',
        tipo: 'Revisión de Formato',
        aspecto: 'Etiquetas y Unidades Claras',
        validar: '¿Todos los valores de KPIs, gráficos y ejes tienen la unidad de medida correcta ($, %, M, K) y etiquetas completas?',
        criterio: 'Todos los valores tienen unidad de medida correcta y etiquetas completas.',
      },
      {
        id: '5',
        tipo: 'Revisión de Formato',
        aspecto: 'Consistencia de Formato Numérico',
        validar: '¿El número de decimales y el uso de separadores de miles es idéntico en toda la aplicación (KPIs y Tablas)?',
        criterio: 'Número de decimales y separadores de miles idénticos en toda la app.',
      },
      {
        id: '6',
        tipo: 'Revisión de Diseño',
        aspecto: 'Uso Intencional del Color',
        validar: '¿El color se usa solo para resaltar información clave (Ej: Rojo para Alerta, Verde para Cumplimiento) y no como decoración?',
        criterio: 'Color usado solo para resaltar información clave, no como decoración.',
      },
      {
        id: '7',
        tipo: 'Revisión de Diseño',
        aspecto: 'Contraste de Colores',
        validar: '¿El contraste de fondo/texto cumple con el mínimo de accesibilidad (especialmente en labels de gráficos y textos pequeños)?',
        criterio: 'Contraste mínimo de accesibilidad cumplido en todos los textos.',
      },
      {
        id: '8',
        tipo: 'Revisión de Formato',
        aspecto: 'Tooltips Informativos',
        validar: '¿Los tooltips están activados, son informativos y no muestran información redundante o cruda?',
        criterio: 'Tooltips activados, informativos y sin información cruda/redundante.',
      },
    ],
  },
  {
    title: '5. Diseño y Usabilidad Visual',
    items: [
      {
        id: '9',
        tipo: 'Revisión de Usabilidad',
        aspecto: 'Navegación Intuitiva',
        validar: '¿La posición de la navegación (botones/filtros) es consistente entre las hojas y sigue un flujo lógico?',
        criterio: 'Navegación consistente entre hojas con flujo lógico.',
      },
      {
        id: '10',
        tipo: 'Pruebas de Usabilidad',
        aspecto: 'Diseño Responsivo',
        validar: '¿El tablero es usable y no genera scroll horizontal en dispositivos móviles/pantallas pequeñas? ¿Los objetos no se superponen ni se cortan al redimensionar?',
        criterio: 'Sin scroll horizontal ni superposición de objetos en pantallas pequeñas.',
      },
      {
        id: '11',
        tipo: 'Revisión de Diseño',
        aspecto: 'Uso de Títulos',
        validar: '¿Todas las hojas, gráficos y tablas tienen un título claro y autoexplicativo para el usuario?',
        criterio: 'Todos los elementos tienen título claro y autoexplicativo.',
      },
      {
        id: '12',
        tipo: 'Revisión de Diseño',
        aspecto: 'Densidad de Información',
        validar: '¿El diseño evita la sobrecarga visual (chart junk)? ¿No hay demasiados objetos en una sola hoja?',
        criterio: 'Sin sobrecarga visual; cantidad de objetos por hoja razonable.',
      },
    ],
  },
]

export const ALL_ITEMS: QAItem[] = SECTIONS.flatMap(s => s.items)

export function calcularPorcentaje(
  responses: Record<string, Resultado>
): { porcentaje: number | null; aprobados: number; total: number; na: number } {
  const aprobados = ALL_ITEMS.filter(i => responses[i.id] === 'aprobado').length
  const na = ALL_ITEMS.filter(i => responses[i.id] === 'na').length
  const total = ALL_ITEMS.length - na

  if (total === 0) return { porcentaje: null, aprobados: 0, total: 0, na }
  return { porcentaje: Math.round((aprobados / total) * 100), aprobados, total, na }
}
