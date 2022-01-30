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
  readonly reportFiles: string[] = getInputAsArray(Inputs.REPORT_FILES, {
    required: true
  })
  readonly reportTypes: string[] = getInputAsArray(Inputs.REPORT_TYPES) || []
  readonly reportTitles: string[] = getInputAsArray(Inputs.REPORT_TITLES) || []

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
    if (!this.reportFiles && this.buildFailEnabled) {
      core.setFailed('No Coverage Files Found')
    }

    const check = await this.postRunCheck()
    let render = ''
    let conclusion: 'success' | 'failure' = 'success'
    let unmetRequirements: UnmetRequirement[] = []

    try {
      const generatedReports = await CoverageReport.generateFileReports(
        this.reportFiles,
        this.reportTypes,
        this.reportTitles
      )

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

      if (unmetRequirements.length && this.buildFailEnabled) {
        conclusion = 'failure'
      }
    } catch (e) {
      if (this.buildFailEnabled) {
        conclusion = 'failure'
      }
    } finally {
      try {
        if (this.getByteLength(render) > 62550) {
          render = render.replace(
            /<details><summary>Expand Report<\/summary>(.+?)<\/details>/g,
            ''
          )
        }
        core.debug('Report exceeded Github size limit. Truncating it.')
        await this.updateRunCheck(check.id, conclusion, render)
      } catch (e) {
        core.debug('There was an error posting check conclusion.')
        await this.updateRunCheck(
          check.id,
          conclusion,
          'There was an error posting check conclusion. See logs for more info.'
        )
      }

      if (unmetRequirements.length && this.buildFailEnabled) {
        core.setFailed(JSON.stringify({unmetRequirements}))
      }
    }
  }

  async postComment(message: string): Promise<void> {
    if (!this.commentDisabled) {
      if (this.context.eventName === 'pull_request') {
        await this.postPullRequestComment(message)
      } else if (this.context.eventName === 'push') {
        await this.postCommitComment(message)
      }
    }
  }

  async postRunCheck(): Promise<CheckResponse> {
    const name = this.getTitle()
    core.debug('Setting check in progress.')
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

    core.debug(`Check run URL: ${resp.data.url}`)
    core.debug(`Check run HTML: ${resp.data.html_url}`)
    return resp.data
  }

  async updateRunCheck(
    runId: number,
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
    core.debug(`Updating Run Check: ${runId} ${icon}`)
    const resp = await this.octokit.rest.checks.update({
      check_run_id: runId,
      conclusion,
      status: 'completed',
      output: {
        title: `${name} ${icon}`,
        summary,
        annotations
      },
      ...github.context.repo
    })

    core.debug(`Update Check run URL: ${resp.data.url}`)
    core.debug(`Update Check run HTML: ${resp.data.html_url}`)
    return resp.data
  }

  private async postCommitComment(message: string): Promise<void> {
    core.debug(`Posting commit comment.`)
    const resp = await this.octokit.rest.repos.createCommitComment({
      ...this.context.repo,
      commit_sha: this.context.sha,
      body: this.getMessageHeader() + message
    })
    core.debug(`Comment URL: ${resp.data.url}`)
    core.debug(`Comment HTML: ${resp.data.html_url}`)
  }

  private async postPullRequestComment(message: string): Promise<void> {
    if (this.context.payload.pull_request?.number) {
      let response
      const previousComments = await this.listPreviousComments()

      if (!previousComments.length) {
        core.debug(`No previous comments found, creating a new one...`)
        response = await this.octokit.rest.issues.createComment({
          ...this.context.repo,
          issue_number: this.context.payload.pull_request.number,
          body: this.getMessageHeader() + message
        })
      } else {
        core.debug(`Previous comment found, updating...`)
        response = await this.octokit.rest.issues.updateComment({
          ...this.context.repo,
          comment_id: previousComments[0].id,
          body: this.getMessageHeader() + message + this.getUpdateFooter()
        })
      }

      if (previousComments.length > 1) {
        const surplusComments = previousComments.slice(1)
        if (surplusComments.length)
          core.debug(`Removing surplus comments. (${surplusComments.length}`)
        for (const comment of surplusComments) {
          await this.octokit.rest.issues.deleteComment({
            ...this.context.repo,
            comment_id: comment.id
          })
        }
      }
      if (response) {
        core.debug(`Post message status: ${response.status}`)
        core.debug(`Issue URL: ${response.data.issue_url}`)
        core.debug(`Comment URL: ${response.data.url}`)
        core.debug(`Comment HTML: ${response.data.html_url}`)
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
}
