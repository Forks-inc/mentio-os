/** Plain-language definitions used across Ágora's help tips. */
export const GLOSSARY = {
  menciones: {
    label: 'Menciones',
    definition: 'Publicaciones y reseñas que coinciden con un término que monitorea la campaña.',
    example: 'Un post que dice “María López propone mejorar la seguridad” cuenta como mención.',
  },
  'participación de voz': {
    label: 'Participación de voz',
    definition: 'Proporción de menciones que recibe cada candidato o adversario frente al total de ambos.',
    example: 'Si hay 60 menciones a María y 40 a José, sus participaciones son 60% y 40%.',
  },
  'sentimiento o tono': {
    label: 'Sentimiento o tono',
    definition: 'Clasifica la conversación como positiva, neutral o negativa según lo que expresa cada publicación.',
    example: '“Me gusta la propuesta” puede ser positivo; “no funciona” puede ser negativo.',
  },
  intención: {
    label: 'Intención',
    definition: 'Indica qué parece querer expresar o hacer quien publica, como apoyar, preguntar o quejarse.',
    example: '“¿Dónde voto?” se clasifica como pregunta.',
  },
  relevancia: {
    label: 'Relevancia',
    definition: 'Señala si una publicación sí habla del candidato o tema que monitoreas.',
    example: 'Una oferta de empleo con el mismo nombre que tu candidata puede descartarse como ruido.',
  },
  alcance: {
    label: 'Alcance',
    definition: 'Estimación de las personas que podrían ver las publicaciones, a partir de sus autores.',
    example: 'Una mención de una cuenta con 2,000 seguidores aporta hasta 2,000 al alcance estimado.',
  },
  autor: {
    label: 'Autor',
    definition: 'Persona o cuenta que publicó; varias cuentas pueden agruparse si pertenecen a la misma persona.',
    example: 'La cuenta de X y la de Instagram de una misma periodista pueden aparecer juntas.',
  },
  campaña: {
    label: 'Campaña',
    definition: 'Grupo que reúne los términos monitoreados y sus resultados para un mismo esfuerzo político.',
    example: 'La campaña “Municipio 2027” puede agrupar a María López, José Pérez y “seguridad”.',
  },
  candidato: {
    label: 'Candidato',
    definition: 'Persona que representa a tu campaña y cuya conversación quieres seguir.',
    example: 'Registra “María López” como candidata para reunir las publicaciones sobre ella.',
  },
  adversario: {
    label: 'Adversario',
    definition: 'Candidato de otra campaña que agregas para comparar la conversación pública.',
    example: 'Registra “José Pérez” como adversario para comparar sus menciones con las de María.',
  },
  tema: {
    label: 'Tema',
    definition: 'Asunto de agenda que la campaña sigue, sin atribuirlo a una persona candidata.',
    example: '“Seguridad” o “movilidad” son temas que puedes monitorear.',
  },
  alerta: {
    label: 'Alerta',
    definition: 'Aviso automático cuando llegan menciones que cumplen las condiciones que eliges.',
    example: 'Recibe un aviso cuando haya una queja nueva sobre seguridad.',
  },
  'resumen periódico': {
    label: 'Resumen periódico',
    definition: 'Reporte programado que reúne los cambios de conversación durante un periodo.',
    example: 'Cada lunes puedes recibir un resumen de las menciones de la semana anterior.',
  },
  'vista guardada': {
    label: 'Vista guardada',
    definition: 'Búsqueda de menciones con filtros guardados para volver a consultarla.',
    example: 'Guarda “críticas a la propuesta de seguridad” para abrirla con un clic.',
  },
  segmento: {
    label: 'Segmento',
    definition: 'Grupo de autores que se actualiza según los filtros que eliges.',
    example: 'Un segmento puede reunir autores que mencionan movilidad y tienen actividad reciente.',
  },
  'filtros de ruido': {
    label: 'Filtros de ruido',
    definition: 'Reglas que descartan términos, autores o foros para reducir coincidencias que no sirven a la campaña.',
    example: 'Excluir “vacante” ayuda a evitar ofertas de empleo que usan el mismo nombre que tu candidata.',
  },
} as const;

export type GlossaryTerm = keyof typeof GLOSSARY;
