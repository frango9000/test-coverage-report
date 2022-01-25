import {FileCoverageReport} from './interface'

export const mockJacocoFilesReport: FileCoverageReport[] = [
  {
    title: 'Utils.java',
    file: 'C:/w/test-coverage-report/dev/kurama/jacoco/Utils.java',
    functions: {found: 7, hit: 3, percentage: 42.86},
    lines: {found: 7, hit: 3, percentage: 42.86},
    branches: {found: 0, hit: 0, percentage: 100},
    statements: {hit: 6, found: 14, percentage: 42.86}
  },
  {
    title: 'Math.kt',
    file: 'C:/w/test-coverage-report/dev/kurama/jacoco/Math.kt',
    functions: {found: 4, hit: 2, percentage: 50},
    lines: {found: 4, hit: 2, percentage: 50},
    branches: {found: 0, hit: 0, percentage: 100},
    statements: {hit: 4, found: 8, percentage: 50}
  },
  {
    title: 'StringOp.java',
    file: 'C:/w/test-coverage-report/dev/kurama/jacoco/operation/StringOp.java',
    functions: {found: 2, hit: 2, percentage: 100},
    lines: {found: 2, hit: 2, percentage: 100},
    branches: {found: 0, hit: 0, percentage: 100},
    statements: {hit: 4, found: 4, percentage: 100}
  }
]

export const mockJacocoOverallReport: FileCoverageReport = {
  functions: {hit: 7, found: 13, percentage: 53.85},
  lines: {hit: 7, found: 13, percentage: 53.85},
  branches: {hit: 0, found: 0, percentage: 100},
  title: 'jacoco.xml',
  file: undefined,
  statements: {hit: 14, found: 26, percentage: 53.85}
}

export const mockLcovFilesReport = [
  {
    lines: {found: 43, hit: 41, percentage: 95.35},
    functions: {hit: 10, found: 10, percentage: 100},
    branches: {hit: 9, found: 12, percentage: 75},
    title: 'coverage-report.ts',
    file: 'C:/w/test-coverage-report/src/coverage-report.ts',
    statements: {hit: 60, found: 65, percentage: 92.31}
  },
  {
    lines: {found: 14, hit: 14, percentage: 100},
    functions: {hit: 3, found: 3, percentage: 100},
    branches: {hit: 6, found: 6, percentage: 100},
    title: 'interface.ts',
    file: 'C:/w/test-coverage-report/src/interface.ts',
    statements: {hit: 23, found: 23, percentage: 100}
  },
  {
    lines: {found: 2, hit: 2, percentage: 100},
    functions: {hit: 0, found: 0, percentage: 100},
    branches: {hit: 0, found: 0, percentage: 100},
    title: 'mocks.ts',
    file: 'C:/w/test-coverage-report/src/mocks.ts',
    statements: {hit: 2, found: 2, percentage: 100}
  },
  {
    lines: {found: 15, hit: 15, percentage: 100},
    functions: {hit: 7, found: 7, percentage: 100},
    branches: {hit: 27, found: 42, percentage: 64.29},
    title: 'renderer.ts',
    file: 'C:/w/test-coverage-report/src/renderer.ts',
    statements: {hit: 49, found: 64, percentage: 76.56}
  }
]

export const mockLcovOverallReport = {
  functions: {hit: 20, found: 20, percentage: 100},
  lines: {hit: 72, found: 74, percentage: 97.3},
  branches: {hit: 42, found: 60, percentage: 70},
  file: undefined,
  title: 'lcov.info',
  statements: {hit: 134, found: 154, percentage: 87.01}
}

export const mockGlobalReport = {
  functions: {hit: 27, found: 33, percentage: 81.82},
  lines: {hit: 79, found: 87, percentage: 90.8},
  branches: {hit: 42, found: 60, percentage: 70},
  title: 'Global Report',
  statements: {hit: 148, found: 180, percentage: 82.22},
  file: undefined
}
