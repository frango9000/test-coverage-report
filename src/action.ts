import * as core from '@actions/core'
import * as github from '@actions/github'
import {
  Annotation,
  CheckResponse,
  CoverageRequirements,
  Inputs,
  IssueComment,
  UnmetRequirement
} from './interface'
import {getInputAsArray, getInputAsBoolean, getInputAsNumber} from './utils'
import {Context} from '@actions/github/lib/context'
import {CoverageReport} from './coverage-report'
import {GitHub} from '@actions/github/lib/utils'
import {Renderer} from './renderer'
import glob from 'fast-glob'
import {p} from '@frango9000/html-builder'

export class Action {
  readonly octokit: InstanceType<typeof GitHub>
  readonly context: Context

  readonly token = core.getInput(Inputs.TOKEN, {required: true})
  readonly title = core.getInput(Inputs.TITLE)
  readonly commentDisabled = getInputAsBoolean(Inputs.DISABLE_COMMENT, {
    required: true
  })
  readonly buildFailEnabled = getInputAsBoolean(Inputs.ENABLE_BUILD_FAIL, {
    required: true
  })
  readonly path: string[] = getInputAsArray(Inputs.REPORT_PATHS, {
    required: true
  })
  readonly pathReplaceBackslashes = getInputAsBoolean(
    Inputs.REPORT_PATHS_REPLACE_BACKSLASHES,
    {
      required: false
    }
  )

  readonly minCoverage: CoverageRequirements = {
    file: {
      error: getInputAsNumber(Inputs.FILE_COVERAGE_ERROR_MIN) || 0,
      warn: getInputAsNumber(Inputs.FILE_COVERAGE_WARN_MIN) || 0
    },
    report: {
      error: getInputAsNumber(Inputs.REPORT_COVERAGE_ERROR_MIN) || 0,
      warn: getInputAsNumber(Inputs.REPORT_COVERAGE_WARN_MIN) || 0
    },
    global: {
      error: getInputAsNumber(Inputs.GLOBAL_COVERAGE_ERROR_MIN) || 0,
      warn: getInputAsNumber(Inputs.GLOBAL_COVERAGE_WARN_MIN) || 0
    }
  }

  constructor() {
    this.octokit = github.getOctokit(this.token)
    this.context = github.context
  }

  async run(): Promise<void> {
    if (!this.path.length) {
      this.failOrWarn('No Coverage Files Provided')
      return
    }

    const pathPatterns = this.pathReplaceBackslashes
      ? this.path.map(this.replaceBackslashes.bind(this))
      : this.path

    let reportFiles: string[] = []

    try {
      reportFiles = findFiles(pathPatterns)
    } catch (e) {
      this.failOrWarn('There was an error searching for coverage files')
      return
    }

    if (!reportFiles.length) {
      this.failOrWarn('No Coverage Files Found')
      return
    }

    let render = ''
    let check
    let conclusion: 'success' | 'failure' = 'success'
    let unmetRequirements: UnmetRequirement[] = []

    try {
      if (this.context.eventName === 'pull_request') {
        check = await this.postRunCheck()
      }

      const generatedReports: CoverageReport[] =
        await CoverageReport.generateFileReports(reportFiles)

      const globalReport: CoverageReport | null =
        CoverageReport.generateGlobalReport(generatedReports)

      render = new Renderer(
        this.context.repo,
        this.context.payload.after,
        generatedReports,
        globalReport,
        this.minCoverage
      ).render()

      await this.postComment(render)

      unmetRequirements = CoverageReport.getUnmetRequirements(
        generatedReports,
        globalReport,
        this.minCoverage
      )

      if (this.buildFailEnabled && unmetRequirements.length) {
        conclusion = 'failure'
      }
    } catch (e) {
      core.info(`Something went wrong: ${e}`)
      if (this.buildFailEnabled) {
        conclusion = 'failure'
      }
    } finally {
      if (this.context.eventName === 'pull_request' && check?.id) {
        this.concludeRunCheck(check.id, render, conclusion)
      }

      if (this.buildFailEnabled && unmetRequirements.length) {
        core.setFailed(JSON.stringify({unmetRequirements}))
      }
    }
  }

  private failOrWarn(message: string): void {
    ;(this.buildFailEnabled ? core.setFailed : core.info)(message)
  }

  private async postComment(message: string): Promise<void> {
    if (!this.commentDisabled) {
      try {
        if (this.context.eventName === 'pull_request') {
          await this.postPullRequestComment(message)
        } else if (this.context.eventName === 'push') {
          await this.postCommitComment(message)
        }
      } catch (e) {
        core.info(`Error posting comment: ${e}`)
      }
    }
  }

  private async concludeRunCheck(
    checkRunId: number,
    render: string,
    conclusion: 'success' | 'failure'
  ): Promise<void> {
    try {
      if (this.getByteLength(render) > 60000) {
        core.info(`Original Report:`)
        core.info('Report exceeded Github size limit. Truncating it.')
        render = render.replace(
          /<details><summary>Expand Report<\/summary>(.+?)<\/details>/g,
          ''
        )
      }
      await this.updateRunCheck(checkRunId, conclusion, render)
    } catch (e) {
      core.info('There was an error posting check conclusion.')
      await this.updateRunCheck(
        checkRunId,
        conclusion,
        'There was an error posting check conclusion. See logs for more info.'
      )
    }
  }

  private async postRunCheck(): Promise<CheckResponse> {
    const name = this.getTitle()
    core.info('Setting check in progress.')
    const resp = await this.octokit.rest.checks.create({
      ...this.context.repo,
      head_sha: this.context.sha,
      name,
      status: 'in_progress',
      output: {
        title: name,
        summary: 'In progress...'
      }
    })

    core.info(`Check run URL: ${resp.data.url}`)
    core.info(`Check run HTML: ${resp.data.html_url}`)
    return resp.data
  }

  private async updateRunCheck(
    checkRunId: number,
    conclusion:
      | 'action_required'
      | 'cancelled'
      | 'failure'
      | 'neutral'
      | 'success'
      | 'skipped'
      | 'timed_out',
    summary: string,
    annotations: Annotation[] = []
  ): Promise<CheckResponse> {
    const name = this.getTitle()
    const icon = conclusion === 'success' ? '✔' : '❌'
    core.info(`Updating Run Check: ${checkRunId} ${icon}`)
    const resp = await this.octokit.rest.checks.update({
      ...github.context.repo,
      check_run_id: checkRunId,
      conclusion,
      status: 'completed',
      output: {
        title: `${name} ${icon}`,
        summary,
        annotations
      }
    })

    core.info(`Update Check run URL: ${resp.data.url}`)
    core.info(`Update Check run HTML: ${resp.data.html_url}`)
    return resp.data
  }

  private async postCommitComment(message: string): Promise<void> {
    core.info(`Posting commit comment.`)
    const resp = await this.octokit.rest.repos.createCommitComment({
      ...this.context.repo,
      commit_sha: this.context.sha,
      body: this.getMessageHeader() + message
    })
    core.info(`Comment URL: ${resp.data.url}`)
    core.info(`Comment HTML: ${resp.data.html_url}`)
  }

  private async postPullRequestComment(message: string): Promise<void> {
    if (this.context.payload.pull_request?.number) {
      let response
      const previousComments = await this.listPreviousComments()

      if (!previousComments.length) {
        core.info(`No previous comments found, creating a new one...`)
        response = await this.octokit.rest.issues.createComment({
          ...this.context.repo,
          issue_number: this.context.payload.pull_request.number,
          body: this.getMessageHeader() + message
        })
      } else {
        core.info(`Previous comment found, updating...`)
        response = await this.octokit.rest.issues.updateComment({
          ...this.context.repo,
          comment_id: previousComments[0].id,
          body: this.getMessageHeader() + message + this.getUpdateFooter()
        })
      }

      if (previousComments.length > 1) {
        const surplusComments = previousComments.slice(1)
        if (surplusComments.length)
          core.info(`Removing surplus comments. (${surplusComments.length}`)
        for (const comment of surplusComments) {
          await this.octokit.rest.issues.deleteComment({
            ...this.context.repo,
            comment_id: comment.id
          })
        }
      }
      if (response) {
        core.info(`Post message status: ${response.status}`)
        core.info(`Issue URL: ${response.data.issue_url}`)
        core.info(`Comment URL: ${response.data.url}`)
        core.info(`Comment HTML: ${response.data.html_url}`)
      }
    }
  }

  private async listPreviousComments(): Promise<IssueComment[]> {
    const per_page = 20
    let results: IssueComment[] = []
    let page = 1
    let response
    if (this.context.payload.pull_request?.number) {
      do {
        response = await this.octokit.rest.issues.listComments({
          ...this.context.repo,
          issue_number: this.context.payload.pull_request?.number,
          page,
          per_page
        })
        results = [...results, ...response.data]
        page++
      } while (response.data.length === per_page)
    }
    return results.filter(comment =>
      comment.body?.includes(this.getMessageHeader())
    )
  }

  private getMessageHeader(): string {
    return p(
      {'data-id': this.context.payload.pull_request?.id},
      this.getTitle()
    )
  }

  private getTitle(): string {
    const customTitle = this.title ? `${this.title} | ` : ''
    return `${customTitle}Coverage Report`
  }

  private getUpdateFooter(): string {
    return p(`Last Update @ ${new Date().toUTCString()}`)
  }

  private getByteLength(text: string): number {
    return Buffer.byteLength(text, 'utf8')
  }

  private replaceBackslashes(path: string): string {
    if (!path) {
      return path
    }

    return path.trim().replace(/\\/g, '/')
  }
}

export function findFiles(pathPatterns: string[]): string[] {
  const paths: string[] = []
  for (const pattern of pathPatterns) {
    try {
      paths.push(
        ...glob.sync(pattern, {
          onlyFiles: true,
          dot: true
        })
      )
    } catch (error) {
      core.info(`Failed to find files with pattern: ${pattern}`)
    }
  }
  return paths
}
