import { API_BASE_URL } from '@/services/api'

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getFileNameFromDisposition = (headerValue: string | null) => {
  if (!headerValue) return ''
  const match = headerValue.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  if (!match) return ''
  const filename = match[1] ?? ''
  try {
    return decodeURIComponent(filename)
  } catch {
    return filename
  }
}

export async function downloadDiagnosisPdf(id: string, patientToken?: string) {
  const headers: Record<string, string> = {}
  const authToken = localStorage.getItem('authToken')
  if (authToken) headers.Authorization = `Bearer ${authToken}`
  if (patientToken) headers['X-Patient-Token'] = patientToken

  const response = await fetch(`${API_BASE_URL}/diagnosis/${encodeURIComponent(id)}/pdf`, { headers })

  if (!response.ok) {
    throw new Error('Erreur lors de la génération du PDF.')
  }

  const blob = await response.blob()
  const objectUrl = window.URL.createObjectURL(blob)
  const fallbackName = `pediguide-compte-rendu-${formatDate(new Date())}.pdf`
  const fileName = getFileNameFromDisposition(response.headers.get('content-disposition')) || fallbackName

  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
