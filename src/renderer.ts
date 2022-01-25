import {
  a,
  details,
  fragment,
  hr,
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
import {FileCoverageReport} from './interface'

export class Renderer {
  constructor(
    private readonly repository: string,
    private readonly commit: string,
    private readonly reports: CoverageReport[],
    private readonly globalReport?: CoverageReport | null
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
        this.renderOverallCoverage(report, 'Report'),
        this.renderFilesCoverage(report),
        i !== reports.length - 1 ? hr() : ''
      )
    }
    return reportRender
  }

  private renderOverallCoverage(
    report: CoverageReport,
    firstTh: string
  ): string {
    return table(
      this.tableHeader(firstTh),
      tbody(this.renderCoverageRow(report.overallReport))
    )
  }

  private renderFilesCoverage(report: CoverageReport): string {
    return details(
      summary('Expand Report'),
      table(
        this.tableHeader('File Coverage'),
        tbody(
          ...report.filesReport.map(fileReport =>
            this.renderCoverageRow(fileReport)
          )
        )
      )
    )
  }

  private tableHeader(firstTh = ''): string {
    return thead(
      tr(
        th(firstTh),
        th('Statements'),
        th('Lines'),
        th('Functions'),
        th('Branches')
      )
    )
  }

  private renderCoverageRow(file: FileCoverageReport): string {
    const prefix = process.env.GITHUB_WORKSPACE?.replace(/\\/g, '/')
    const relative = prefix && file.file?.replace(prefix, '')
    const href = `https://github.com/${this.repository}/blob/${this.commit}/${relative}`

    const title = file.file
      ? a({href}, file?.title || ``)
      : a(file?.title || '')
    return !file
      ? ''
      : tr(
          td(title),
          td(`${file.statements?.percentage}%`),
          td(`${file.lines?.percentage}%`),
          td(`${file.functions?.percentage}%`),
          td(`${file.branches?.percentage}%`)
        )
  }

  private renderGlobalReport(globalReport: CoverageReport): string {
    return fragment(
      table(this.renderOverallCoverage(globalReport, 'Global')),
      hr()
    )
  }
}
