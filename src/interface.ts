export interface CheckResponse {
  id: number
  url: string | null
  html_url: string | null
}

export interface IssueComment {
  id: number
  body?: string
  html_url: string
  issue_url: string
  url: string
}

export interface Annotation {
  path: string
  start_line: number
  end_line: number
  start_column?: number
  end_column?: number
  annotation_level: 'notice' | 'warning' | 'failure'
  message: string
  title?: string
  raw_details?: string
}
