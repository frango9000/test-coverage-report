export enum ReportType {
  JACOCO = 'jacoco',
  LCOV = 'lcov'
}

export enum ReportExtension {
  JACOCO = 'xml',
  LCOV = 'info'
}

export const SupportedReports = [
  ...Object.values(ReportType).map(value => String(value)),
  'global'
]

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
  ENABLE_BUILD_FAIL = 'enable-build-fail',

  REPORT_FILES = 'report-files',
  REPORT_TYPES = 'report-types',
  REPORT_TITLES = 'report-titles',

  FILE_COVERAGE_ERROR_MIN = 'file-coverage-error-min',
  FILE_COVERAGE_WARN_MIN = 'file-coverage-warn-min',
  REPORT_COVERAGE_ERROR_MIN = 'report-coverage-error-min',
  REPORT_COVERAGE_WARN_MIN = 'report-coverage-warn-min',
  GLOBAL_COVERAGE_ERROR_MIN = 'global-coverage-error-min',
  GLOBAL_COVERAGE_WARN_MIN = 'global-coverage-warn-min'
}

export interface CoverageRequirements {
  file: CoverageRequirement
  report: CoverageRequirement
  global: CoverageRequirement
}

export interface CoverageRequirement {
  error: number
  warn: number
}

export interface UnmetRequirement {
  title?: string
  file?: string
  requirement: number
  coverage: number
}
