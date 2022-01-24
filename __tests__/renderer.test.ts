import {Renderer} from '../src/renderer'
import {CoverageReport} from '../src/coverage-report'
import {mockJacocoFilesReport, mockJacocoOverallReport} from '../src/mocks'

describe('Renderer Tests', () => {
  let renderer: Renderer

  const repository = 'repositoryName'
  const commit = 'commitHash'

  beforeEach(() => {
    const report = new CoverageReport('jacoco.xml')
    report['_filesReport'] = mockJacocoFilesReport
    report['_overallReport'] = mockJacocoOverallReport
    renderer = new Renderer(report, repository, commit)
  })

  it('should render coverage in html', () => {
    expect(renderer.renderCoverage()).toBe(
      "<table><tr><thead><td></td><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></thead></tr><tbody><tr><td><p>Overall Coverage</p></td><td>53.85%</td><td>53.85%</td><td>53.85%</td><td>100%</td></tr></tbody></table><details><summary>Expand Report</summary><table><tr><thead><td></td><th>Statements</th><th>Lines</th><th>Functions</th><th>Branches</th></thead></tr><tbody><tr><td><a href='https://github.com/repositoryName/blob/commitHash/undefined'>Utils.java</a></td><td>42.86%</td><td>42.86%</td><td>42.86%</td><td>100%</td></tr><tr><td><a href='https://github.com/repositoryName/blob/commitHash/undefined'>Math.kt</a></td><td>50%</td><td>50%</td><td>50%</td><td>100%</td></tr><tr><td><a href='https://github.com/repositoryName/blob/commitHash/undefined'>StringOp.java</a></td><td>100%</td><td>100%</td><td>100%</td><td>100%</td></tr></tbody></table></details>"
    )
  })
})
