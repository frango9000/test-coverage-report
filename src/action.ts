import * as core from '@actions/core'
import * as github from '@actions/github'
import {Annotation, CheckResponse, Inputs, IssueComment} from './interface'
import {div, p} from '@frango9000/html-builder'
import {getInputAsArray, getInputAsBoolean} from './utils'
import {Context} from '@actions/github/lib/context'
import {CoverageReport} from './coverage-report'
import {GitHub} from '@actions/github/lib/utils'
import {Renderer} from './renderer'

export class Action {
  readonly token = core.getInput(Inputs.TOKEN, {required: true})
  readonly title = core.getInput(Inputs.TITLE)
  readonly disableComment = getInputAsBoolean(Inputs.DISABLE_COMMENT, {
    required: true
  })
  readonly disableBuildFail = getInputAsBoolean(Inputs.DISABLE_BUILD_FAIL, {
    required: true
  })
  readonly coverageFiles: string[] = getInputAsArray(Inputs.COVERAGE_FILES, {
    required: true
  })
  readonly coverageTypes: string[] = getInputAsArray(Inputs.COVERAGE_TYPES, {
    required: true
  })
  readonly octokit: InstanceType<typeof GitHub>
  readonly context: Context

  constructor() {
    this.octokit = github.getOctokit(this.token)
    this.context = github.context

    core.debug(JSON.stringify(this.context))
  }

  async run(): Promise<void> {
    if (!this.coverageFiles && !this.disableBuildFail)
      core.setFailed('No Coverage Files Found')

    const check = await this.postRunCheck()

    const message = await this.getAggregatedReports()

    await this.postComment(message)

    await this.updateRunCheck(check.id, 'success', message)
  }

  async postComment(message: string): Promise<void> {
    if (!this.disableComment) {
      if (this.context.eventName === 'pull_request') {
        await this.postPullRequestComment(message)
      } else if (this.context.eventName === 'push') {
        await this.postCommitComment(message)
      }
    }
  }

  async postRunCheck(): Promise<CheckResponse> {
    const name = this.getTitle()
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

    core.debug(`Check run URL: ${resp.data.url}`)
    core.debug(`Check run HTML: ${resp.data.html_url}`)
    return resp.data
  }

  private async postCommitComment(message: string): Promise<void> {
    const resp = await this.octokit.rest.repos.createCommitComment({
      ...this.context.repo,
      commit_sha: this.context.sha,
      body: message
    })
    core.debug(`Check run create response: ${resp.status}`)
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
          body: this.getHtmlTitle() + message
        })
      } else {
        core.debug(`Previous comment found, updating...`)
        response = await this.octokit.rest.issues.updateComment({
          ...this.context.repo,
          comment_id: previousComments[0].id,
          body: this.getHtmlTitle() + message + this.getUpdateFooter()
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

  private getUpdateFooter(): string {
    return `<p>Last Update @ ${new Date().toUTCString()}<p>`
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
      comment.body?.includes(this.getHtmlTitle())
    )
  }

  private getHtmlTitle(): string {
    return p(
      {'data-id': this.context.payload.pull_request?.id},
      this.getTitle()
    )
  }

  private getTitle(): string {
    const customTitle = this.title ? ` | ${this.title}` : ''
    return `Test Coverage Report${customTitle}`
  }

  private async getAggregatedReports(): Promise<string> {
    let aggregatedReport = ''

    for (let i = 0; i < this.coverageFiles.length; i++) {
      const reporter = await new CoverageReport(
        this.coverageFiles[i],
        this.coverageTypes[i] || null
      ).init()

      const renderer = new Renderer(
        reporter,
        this.context.repo.repo,
        this.context.payload.after
      )

      aggregatedReport += div(renderer.renderCoverage())
    }
    return aggregatedReport
  }
}
