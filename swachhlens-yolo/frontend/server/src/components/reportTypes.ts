export type Report = {
  report_id: string
  citizen_id?: string
  latitude?: number
  longitude?: number
  captured_at?: string
  comment?: string | null
  status?: string
  ai_category?: string | null
  ai_confidence?: number | null
  created_at?: string
}
