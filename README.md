[![GitHub release badge](https://badgen.net/github/release/frango9000/test-coverage-report)](https://github.com/frango9000/test-coverage-report/releases/latest)
[![GitHub license badge](https://badgen.net/github/license/frango9000/test-coverage-report)](MIT)  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>

# Test Coverage Report

A Github Action that publishes Test Coverage Reports as a check and a comment in
the commit/pull request, with a customizable coverage requirements.

If there is already a comment on the PR, it will be updated instead of posting
multiple comments. This uses the provided title input as identifier, so if you
want multiple reports publishing multiple comments and not overwriting one
another provide different titles to each action configuration

## Usage

### Requirements

Create a workflow `.yml` file in your repositories `.github/workflows`
directory. An [example workflow](#example-workflow) is available below. For more
information, reference the GitHub Help Documentation
for [Creating a workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)
.

### Inputs

- `token` - [**required**] Github personal token to add commits to Pull Request
- `title` - [*optional*] Title of the comment to post on the check/commit/pull
  request
- `disable-comment` - [*optional*] set to true if you do not want to post a
  comment
- `report-files` - [**required**] List of paths to the coverage report files
- `report-types` - [*optional*] List of types of report ('lcov' | 'jacoco'), in
  the same order as the report-types. If not provided will try to detect by the
  file extension
- `report-titles` - [*optional*] List of titles for each report, in the same
  order as the report-types.
- `enable-build-fail` - [*optional*] set to true if want to enforce provided
  minimum coverage failing the build if not met.
- `file-coverage-error-min` - [*optional*] The minimum code coverage that is
  required per file. Will fail if it is less
- `file-coverage-warn-min` - [*optional*] The minimum code coverage that is
  recommended per file. Will warn if it is less
- `report-coverage-error-min` - [*optional*] The minimum code coverage that is
  required per report. Will fail if it is less
- `report-coverage-warn-min` - [*optional*] The minimum code coverage that is
  recommended per report. Will warn if it is less
- `global-coverage-error-min` - [*optional*] The minimum code coverage that is
  required per global. Will fail if it is less
- `global-coverage-warn-min` - [*optional*] The minimum code coverage that is
  recommended per global. Will warn if it is less

### Workflow Example with a Single Report

```yaml
name: Measure coverage

on:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
          -
      - name: Use Java 11
        uses: actions/setup-java@v2
        with:
          distribution: 'adopt'
          java-version: '11'
          check-latest: true

      - name: Run Coverage
        run: |
          chmod +x gradlew
          ./gradlew testCoverage

      - name: Coverage Report
        uses: frango9000/test-coverage-report@v0.0.1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          title: "App Name"
          report-files: ./targer/target/site/jacoco-ut/jacoco.xml
          # report-types: jacoco         #not needed, if jacoco report has .xml extension or lcov report has .info
          file-coverage-error-min: 60
          file-coverage-warn-min: 80
          report-coverage-error-min: 50
          report-coverage-warn-min: 70
```

### Workflow Example with Multiple Reports

```yaml
name: Measure coverage

on:
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
          -
      - name: Use Java 11
        uses: actions/setup-java@v2
        with:
          distribution: 'adopt'
          java-version: '11'
          check-latest: true

      - name: Use Node 16
        uses: actions/setup-node@v2.5.1
        with:
          node-version: '16'
      - run: npm install

      - name: Run Coverage
        run: |
          chmod +x gradlew
          ./gradlew testCoverage

      - run: npm test --codeCoverage

      - name: Coverage Report
        uses: frango9000/test-coverage-report@v0.0.1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          title: "Frontend and Backend"
          disable-comment: ${{ github.event_name == 'push' }}    # Only post on pull request, not on commit
          report-files: |
            ./targer/target/site/jacoco-ut/jacoco.xml
            ./targer/target/site/jacoco-it/jacoco.xml
            ./coverage/frontend/lcov.info
          report-types: |
            jacoco
            jacoco
            lcov
          report-titles: |
            'Backend Unit Tests'
            'Backend Integration Tests'
            'Frontend Tests'
          enable-build-fail: true
          file-coverage-error-min: 60
          file-coverage-warn-min: 80
          report-coverage-error-min: 50
          report-coverage-warn-min: 70
          global-coverage-error-min: 40
          global-coverage-warn-min: 60
```

### Example

#### Single Report

<img src="/demo/img1.png" alt="output screenshot" title="output screenshot" width="500" />

#### Multiple Reports

<img src="/demo/img2.png" alt="output screenshot" title="output screenshot" width="500" />

### Example Pull Request

[Here](https://github.com/frango9000/test-coverage-report/blob/main/.github/workflows/test.yml)
is an example of several configurations.

[Here](https://github.com/frango9000/test-coverage-report/blob/main/.github/workflows/test.yml)
is an example of output comments.

## License

The scripts and documentation in this project are released under
the [MIT License](LICENSE)
