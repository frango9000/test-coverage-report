export enum ReportType {
  JACOCO = 'jacoco',
  LCOV = 'lcov'
}

export enum ReportExtension {
  JACOCO = 'xml',
  LCOV = 'info'
}

export const SupportedReports = Object.values(ReportType).map(value =>
  String(value)
)

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

export interface CoverageDetail {
  line: number
  hit: number
}

export interface FileCoverageSummary {
  found: number
  hit: number
  percentage?: number
  details?: CoverageDetail[]
}

export interface FileCoverageReport {
  title?: string
  file?: string
  statements?: FileCoverageSummary
  lines: FileCoverageSummary
  functions: FileCoverageSummary
  branches: FileCoverageSummary
}

export enum Inputs {
  TOKEN = 'token',
  TITLE = 'title',
  DISABLE_COMMENT = 'disable-comment',
  DISABLE_BUILD_FAIL = 'disable-build-fail',
  COVERAGE_FILES = 'coverage-files',
  COVERAGE_TYPES = 'coverage-types'
}
