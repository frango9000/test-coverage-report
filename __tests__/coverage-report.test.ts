import {CoverageReport} from '../src/coverage-report'
import {ReportExtension, ReportType} from '../src/interface'
import {
  mockGlobalReport,
  mockJacocoFilesReport,
  mockJacocoOverallReport,
  mockLcovFilesReport,
  mockLcovOverallReport
} from '../src/mocks'

const coverageParser = require('@connectis/coverage-parser')

describe('3rd party Coverage Parser Library Tests', () => {
  it('should load coverage report from file', async () => {
    expect(
      coverageParser.parseFile('./__tests__/__fixtures__/jacoco.xml', {
        type: 'jacoco'
      })
    ).resolves.toHaveLength(3)
  })
})

describe('Coverage Report Class', () => {
  let coverageReport: CoverageReport

  describe('Get type by file extension', () => {
    it('should use jacoco coverage if type is not provided and file extension is xml', () => {
      const jacoco = new CoverageReport(`jacoco.${ReportExtension.JACOCO}`)
      expect(jacoco['type']).toBe(ReportType.JACOCO)
    })

    it('should use lcov coverage if type is not provided and file extension is lcov', () => {
      const jacoco = new CoverageReport(`coverage.${ReportExtension.LCOV}`)
      expect(jacoco['type']).toBe(ReportType.LCOV)
    })

    it('should throw if extension does not match supported reports', () => {
      expect(() => new CoverageReport('coverage.json')).toThrow()
    })

    it('should throw if file type provided is not suported', () => {
      expect(() => new CoverageReport('coverage.json', 'clover')).toThrow()
      expect(
        () => new CoverageReport('coverage.json', 'golang-cover')
      ).toThrow()
      expect(() => new CoverageReport('coverage.json', 'cobertura')).toThrow()
    })
  })

  describe('Jacoco Fixture', () => {
    beforeEach(() => {
      coverageReport = new CoverageReport(
        './__tests__/__fixtures__/jacoco.xml',
        ReportType.JACOCO
      )
    })

    it('should load and enhance report data on init', async () => {
      await coverageReport.init()
      expect(coverageReport.overallReport).toBeTruthy()
      expect(coverageReport.overallReport.lines).toBeTruthy()
      expect(coverageReport.filesReport).toHaveLength(3)
      expect(coverageReport.filesReport).toStrictEqual(mockJacocoFilesReport)
    })

    it('should load and enhance overall report data on init', async () => {
      await coverageReport.init()
      expect(coverageReport.overallReport).toBeTruthy()
      expect(coverageReport.overallReport).toStrictEqual(
        mockJacocoOverallReport
      )
    })
  })

  describe('Lcov Fixture', () => {
    beforeEach(() => {
      coverageReport = new CoverageReport(
        './__tests__/__fixtures__/lcov.info',
        ReportType.LCOV
      )
    })

    it('should load and enhance report data on init', async () => {
      await coverageReport.init()
      expect(coverageReport.overallReport).toBeTruthy()
      expect(coverageReport.overallReport.lines).toBeTruthy()
      expect(coverageReport.filesReport).toHaveLength(4)
      expect(coverageReport.filesReport).toStrictEqual(mockLcovFilesReport)
    })

    it('should load and enhance overall report data on init', async () => {
      await coverageReport.init()
      expect(coverageReport.overallReport).toBeTruthy()
      expect(coverageReport.overallReport).toStrictEqual(mockLcovOverallReport)
    })
  })

  describe('Static Methods', () => {
    let coverageReports: CoverageReport[]

    beforeEach(async () => {
      coverageReports = await CoverageReport.generateFileReports(
        [
          './__tests__/__fixtures__/jacoco.xml',
          './__tests__/__fixtures__/lcov.info'
        ],
        [ReportType.JACOCO, ReportType.LCOV]
      )
    })

    it('should generate multiple file reports', () => {
      expect(coverageReports).toHaveLength(2)
      expect(coverageReports[0].filesReport).toStrictEqual(
        mockJacocoFilesReport
      )
      expect(coverageReports[0].overallReport).toStrictEqual(
        mockJacocoOverallReport
      )
      expect(coverageReports[1].filesReport).toStrictEqual(mockLcovFilesReport)
      expect(coverageReports[1].overallReport).toStrictEqual(
        mockLcovOverallReport
      )
    })

    it('should generate global report', () => {
      expect(
        CoverageReport.generateGlobalReport(coverageReports)?.overallReport
      ).toStrictEqual(mockGlobalReport)
    })

    it('should return null if there are less than 2 reports', () => {
      expect(CoverageReport.generateGlobalReport([])).toBeNull()
      expect(
        CoverageReport.generateGlobalReport([null as unknown as CoverageReport])
      ).toBeNull()
      expect(
        CoverageReport.generateGlobalReport([{} as unknown as CoverageReport])
      ).toBeNull()
    })
  })
})
