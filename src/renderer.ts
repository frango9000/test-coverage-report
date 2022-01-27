import {
  CoverageRequirement,
  CoverageRequirements,
  FileCoverageReport
} from './interface'
import {
  a,
  details,
  fragment,
  hr,
  p,
  span,
  summary,
  table,
  tbody,
  td,
  th,
  thead,
  tr
} from '@frango9000/html-builder'
import {CoverageReport} from './coverage-report'

export class Renderer {
  constructor(
    private readonly repo: {owner: string; repo: string},
    private readonly commit: string,
    private readonly reports: CoverageReport[],
    private readonly globalReport: CoverageReport | null,
    private readonly minCoverage: CoverageRequirements
  ) {}

  render(): string {
    if (!this.reports?.length) {
      return span('No Coverage Reports Found')
    }
    let render = this.renderReports(this.reports)
    if (this.reports.length > 1 && this.globalReport) {
      render = fragment(
        this.renderGlobalReport(this.globalReport),
        details(summary('Expand Global Report'), render)
      )
    }

    return render
  }

  private renderReports(reports: CoverageReport[]): string {
    let reportRender = ''
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i]
      reportRender += fragment(
        report.title ? fragment(p(), p(report.title), p()) : p(),
        this.renderOverallCoverage(report, 'Report', this.minCoverage.report),
        this.renderFilesCoverage(report),
        i !== reports.length - 1 ? hr() : ''
      )
    }
    return reportRender
  }

  private renderGlobalReport(globalReport: CoverageReport): string {
    return fragment(
      table(
        this.renderOverallCoverage(
          globalReport,
          'Global',
          this.minCoverage.global
        )
      ),
      hr()
    )
  }

  private renderOverallCoverage(
    report: CoverageReport,
    firstTh: string,
    requirements: CoverageRequirement
  ): string {
    return table(
      this.tableHeader(firstTh),
      tbody(this.renderCoverageRow(report.overallReport, requirements))
    )
  }

  private renderFilesCoverage(report: CoverageReport): string {
    return details(
      summary('Expand Report'),
      table(
        this.tableHeader('File'),
        tbody(
          ...report.filesReport.map(fileReport =>
            this.renderCoverageRow(fileReport, this.minCoverage.file)
          )
        )
      )
    )
  }

  private renderCoverageRow(
    fileReport: FileCoverageReport,
    requirements: CoverageRequirement
  ): string {
    const prefix = process.env.GITHUB_WORKSPACE?.replace(/\\/g, '/')
    const relative = prefix && fileReport.file?.replace(prefix, '')
    const href = `https://github.com/${this.repo.owner}/${
      this.repo.repo
    }/blob/${this.commit}/${relative || fileReport.file}`

    const title = fileReport.file
      ? a({href}, fileReport?.title || ``)
      : a(fileReport?.title || '')
    return !fileReport
      ? ''
      : tr(
          td(title),
          td(`${fileReport.lines.percentage}%`),
          td(`${fileReport.functions.percentage}%`),
          td(`${fileReport.branches.percentage}%`),
          td(`${fileReport.statements?.percentage}%`),
          td(
            this.getThresholdIcon(
              fileReport.statements?.percentage,
              requirements
            )
          )
        )
  }

  private tableHeader(firstTh = ''): string {
    return thead(
      tr(
        th(firstTh),
        th('Lines'),
        th('Functions'),
        th('Branches'),
        th('Statements'),
        th()
      )
    )
  }

  private getThresholdIcon(
    percentage: number | undefined,
    requirements: CoverageRequirement
  ): string {
    if (requirements.error && requirements.error > (percentage || 0)) {
      return '❌️'
    }
    if (requirements.warn && requirements.warn > (percentage || 0)) {
      return '⚠️'
    }
    return '✔️'
  }
}
