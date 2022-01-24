import {
  FileCoverageReport,
  FileCoverageSummary,
  ReportExtension,
  ReportType,
  SupportedReports
} from './interface'
// eslint-disable-next-line @typescript-eslint/no-require-imports,@typescript-eslint/no-var-requires,import/no-commonjs
const coverageParser = require('@connectis/coverage-parser')

export class CoverageReport {
  private _filesReport: FileCoverageReport[] = []
  private _overallReport!: FileCoverageReport

  constructor(
    private readonly path: string,
    private type?: ReportType | string | null
  ) {
    if (!this.type) {
      const extension = path.split('.').pop()
      switch (extension) {
        case ReportExtension.JACOCO:
          this.type = ReportType.JACOCO
          break
        case ReportExtension.LCOV:
          this.type = ReportType.LCOV
          break
        default:
          throw Error('Unsupported Report')
      }
    } else {
      if (!SupportedReports.includes(this.type)) {
        throw Error('Unsupported Report')
      }
    }
  }

  get overallReport(): FileCoverageReport {
    return this._overallReport
  }

  get filesReport(): FileCoverageReport[] {
    return this._filesReport
  }

  async init(): Promise<CoverageReport> {
    this._filesReport = await coverageParser.parseFile(this.path, {
      type: this.type
    })
    for (const fileCoverageReport of this._filesReport) {
      this.enhanceCoverageReport(fileCoverageReport)
    }
    this._overallReport = this.measureOverallReport(this._filesReport)
    this.enhanceCoverageReport(this._overallReport)
    return this
  }

  private enhanceCoverageReport(fileCoverageReport: FileCoverageReport): void {
    fileCoverageReport.statements = this.getStatement(fileCoverageReport)
    fileCoverageReport.statements.percentage = this.measurePercentage(
      fileCoverageReport.statements
    )
    delete fileCoverageReport.branches.details
    fileCoverageReport.branches.percentage = this.measurePercentage(
      fileCoverageReport.branches
    )
    delete fileCoverageReport.lines.details
    fileCoverageReport.lines.percentage = this.measurePercentage(
      fileCoverageReport.lines
    )
    delete fileCoverageReport.functions.details
    fileCoverageReport.functions.percentage = this.measurePercentage(
      fileCoverageReport.functions
    )
  }

  private getStatement(fileReport: FileCoverageReport): FileCoverageSummary {
    const {branches, functions, lines} = fileReport

    return [branches, functions, lines].reduce(
      function (acc, curr) {
        if (!curr) {
          return acc
        }

        return {
          hit: acc.hit + curr.hit,
          found: acc.found + curr.found
        }
      },
      {hit: 0, found: 0}
    )
  }

  private measurePercentage(item?: FileCoverageSummary): number {
    return Number.parseFloat(
      (!item || !item.found ? 100 : (item.hit / item.found) * 100).toFixed(2)
    )
  }

  private measureOverallReport(
    items?: FileCoverageReport[]
  ): FileCoverageReport {
    const overallCoverageReport = (items || []).reduce(
      (accumulator, current) => {
        if (!current) {
          return accumulator
        }
        return {
          functions: {
            hit: accumulator.functions.hit + current.functions.hit,
            found: accumulator.functions.found + current.functions.found
          },
          lines: {
            hit: accumulator.lines.hit + current.lines.hit,
            found: accumulator.lines.found + current.lines.found
          },
          branches: {
            hit: accumulator.branches.hit + current.branches.hit,
            found: accumulator.branches.found + current.branches.found
          }
        }
      },
      {
        functions: {hit: 0, found: 0},
        lines: {hit: 0, found: 0},
        branches: {hit: 0, found: 0}
      }
    )
    overallCoverageReport.title = 'Overall Coverage'
    overallCoverageReport.statements = this.getStatement(overallCoverageReport)
    return overallCoverageReport
  }
}
