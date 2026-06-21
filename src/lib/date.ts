const BUSINESS_TIME_ZONE = import.meta.env.VITE_BUSINESS_TIME_ZONE || 'America/Sao_Paulo'

function dateFromValue(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function businessParts(value: string) {
  const date = dateFromValue(value)
  if (!date) return null

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  }
}

export function formatIsoTime(value: string) {
  const parts = businessParts(value)
  if (!parts) return value
  return `${parts.hour}:${parts.minute}`
}

export function formatIsoDate(value: string) {
  const parts = businessParts(value)
  if (!parts) return value
  return `${parts.day}/${parts.month}/${parts.year.slice(-2)}`
}

export function formatIsoDateTime(value: string) {
  return `${formatIsoDate(value)}, ${formatIsoTime(value)}`
}

export function formatIsoDateMonthShort(value: string) {
  const date = dateFromValue(value)
  if (!date) return value

  return date.toLocaleDateString('pt-BR', {
    timeZone: BUSINESS_TIME_ZONE,
    day: '2-digit',
    month: 'short',
  })
}

export function formatIsoDateLong(value: string) {
  const date = dateFromValue(value)
  if (!date) return value

  return date.toLocaleDateString('pt-BR', {
    timeZone: BUSINESS_TIME_ZONE,
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

export function isoDateKey(value: string) {
  const parts = businessParts(value)
  if (!parts) return value.slice(0, 10)
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function compareIsoDateTime(a: string, b: string) {
  return a.localeCompare(b)
}

export function toDateInputValue(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
