import {
  a,
  details,
  fragment,
  p,
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
    private readonly reporter: CoverageReport,
    private readonly repository: string,
    private readonly commit: string
  ) {}

  renderCoverage(): string {
    return fragment(this.renderOverallCoverage(), this.renderFilesCoverage())
  }

  private renderOverallCoverage(): string {
    return table(
      this.tableHeader(),
      tbody(this.coverageRow(this.reporter.overallReport))
    )
  }

  private renderFilesCoverage(): string {
    return details(
      summary('Expand Report'),
      table(
        this.tableHeader(),
        tbody(
          ...this.reporter.filesReport.map(fileReport =>
            this.coverageRow(fileReport)
          )
        )
      )
    )
  }

  private tableHeader(): string {
    return tr(
      thead(
        td(),
        th('Statements'),
        th('Lines'),
        th('Functions'),
        th('Branches')
      )
    )
  }

  private coverageRow(file: FileCoverageReport): string {
    const prefix = process.env.GITHUB_WORKSPACE?.replace(/\\/g, '/')
    const relative = prefix && file.file?.replace(prefix, '')
    const href = `https://github.com/${this.repository}/blob/${this.commit}/${relative}`

    const title = file.file
      ? a({href}, file?.title || ``)
      : p(file?.title || '')
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
}
