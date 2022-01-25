import {Renderer} from '../src/renderer'
import {CoverageReport} from '../src/coverage-report'
import {
  mockGlobalReport,
  mockJacocoFilesReport,
  mockJacocoOverallReport,
  mockLcovFilesReport,
  mockLcovOverallReport
} from '../src/mocks'

describe('Renderer Tests', () => {
  let renderer: Renderer

  const repository = 'owner/repository'
  const commit = 'commitHash'
  const jacoco = new CoverageReport('jacoco.xml')
  jacoco['_filesReport'] = mockJacocoFilesReport
  jacoco['_overallReport'] = mockJacocoOverallReport
  const lcov = new CoverageReport('lcov.info')
  lcov['_filesReport'] = mockLcovFilesReport
  lcov['_overallReport'] = mockLcovOverallReport

  it('should render fallback message if no reports are available', () => {
    renderer = new Renderer(repository, commit, null as any)
    expect(renderer.render()).toBe('<span>No Coverage Reports Found</span>')
    renderer = new Renderer(repository, commit, [])
    expect(renderer.render()).toBe('<span>No Coverage Reports Found</span>')
  })

  it('should render jacoco coverage in html', () => {
    renderer = new Renderer(repository, commit, [jacoco])
    expect(renderer.render()).toBe(
      "<table><thead><tr><th>Report</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a>jacoco.xml</a></td><td>53.85%</td><td>53.85%</td><td>53.85%</td><td>100%</td></tr></tbody></table><details><summary>Expand Report</summary><table><thead><tr><th>File Coverage</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>Utils.java</a></td><td>42.86%</td><td>42.86%</td><td>42.86%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>Math.kt</a></td><td>50%</td><td>50%</td><td>50%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>StringOp.java</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr></tbody></table></details>"
    )
  })

  it('should render lcov coverage in html', () => {
    renderer = new Renderer(repository, commit, [lcov])
    expect(renderer.render()).toBe(
      "<table><thead><tr><th>Report</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a>lcov.info</a></td><td>87.01%</td><td>97.3%</td><td>100%</td><td>70%</td></tr></tbody></table><details><summary>Expand Report</summary><table><thead><tr><th>File Coverage</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>coverage-report.ts</a></td><td>92.31%</td><td>95.35%</td><td>100%</td><td>75%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>interface.ts</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>mocks.ts</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>renderer.ts</a></td><td>76.56%</td><td>100%</td><td>100%</td><td>64.29%</td></tr></tbody></table></details>"
    )
  })

  it('should render jacoco and lcov coverage in html', () => {
    renderer = new Renderer(repository, commit, [jacoco, lcov])
    expect(renderer.render()).toBe(
      "<table><thead><tr><th>Report</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a>jacoco.xml</a></td><td>53.85%</td><td>53.85%</td><td>53.85%</td><td>100%</td></tr></tbody></table><details><summary>Expand Report</summary><table><thead><tr><th>File Coverage</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>Utils.java</a></td><td>42.86%</td><td>42.86%</td><td>42.86%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>Math.kt</a></td><td>50%</td><td>50%</td><td>50%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>StringOp.java</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr></tbody></table></details><hr /><table><thead><tr><th>Report</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a>lcov.info</a></td><td>87.01%</td><td>97.3%</td><td>100%</td><td>70%</td></tr></tbody></table><details><summary>Expand Report</summary><table><thead><tr><th>File Coverage</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>coverage-report.ts</a></td><td>92.31%</td><td>95.35%</td><td>100%</td><td>75%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>interface.ts</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>mocks.ts</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>renderer.ts</a></td><td>76.56%</td><td>100%</td><td>100%</td><td>64.29%</td></tr></tbody></table></details>"
    )
  })

  it('should render global coverage in html', () => {
    const global = new CoverageReport('', 'global')
    global['_overallReport'] = mockGlobalReport
    renderer = new Renderer(repository, commit, [jacoco, lcov], global)
    expect(renderer.render()).toBe(
      "<table><table><thead><tr><th>Global</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a>Global Report</a></td><td>82.22%</td><td>90.8%</td><td>81.82%</td><td>70%</td></tr></tbody></table></table><hr /><details><summary>Expand Global Report</summary><table><thead><tr><th>Report</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a>jacoco.xml</a></td><td>53.85%</td><td>53.85%</td><td>53.85%</td><td>100%</td></tr></tbody></table><details><summary>Expand Report</summary><table><thead><tr><th>File Coverage</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>Utils.java</a></td><td>42.86%</td><td>42.86%</td><td>42.86%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>Math.kt</a></td><td>50%</td><td>50%</td><td>50%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>StringOp.java</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr></tbody></table></details><hr /><table><thead><tr><th>Report</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a>lcov.info</a></td><td>87.01%</td><td>97.3%</td><td>100%</td><td>70%</td></tr></tbody></table><details><summary>Expand Report</summary><table><thead><tr><th>File Coverage</th><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></tr></thead><tbody><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>coverage-report.ts</a></td><td>92.31%</td><td>95.35%</td><td>100%</td><td>75%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>interface.ts</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>mocks.ts</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr><tr><td><a href='https://github.com/owner/repository/blob/commitHash/undefined'>renderer.ts</a></td><td>76.56%</td><td>100%</td><td>100%</td><td>64.29%</td></tr></tbody></table></details></details>"
    )
  })
})
