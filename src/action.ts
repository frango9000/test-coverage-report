import * as core from '@actions/core'
import * as github from '@actions/github'
import {Annotation, CheckResponse, IssueComment} from './interface'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'
import {html} from './html'

export class Action {
  readonly token = core.getInput('token', {required: true})
  readonly title = core.getInput('title')
  readonly disableComment =
    core.getInput('disable-comment', {required: true}).toLowerCase() === 'true'
  readonly disableRunCheck =
    core.getInput('disable-run-check', {required: true}).toLowerCase() ===
    'true'
  readonly octokit: InstanceType<typeof GitHub>
  readonly context: Context

  constructor() {
    this.octokit = github.getOctokit(this.token)
    this.context = github.context

    core.debug(JSON.stringify(this.context))
  }

  async run(): Promise<void> {
    const check = await this.postRunCheck()

    await this.postComment(check.html_url || '')

    await this.updateRunCheck(check.id, 'success', 'Comment Posted on PR')
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
        summary: ''
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
      message = this.getHtmlTitle() + message
      let response
      const previousComments = await this.listPreviousComments()
      if (!previousComments.length) {
        core.debug(`No previous comments found, creating a new one...`)
        response = await this.octokit.rest.issues.createComment({
          ...this.context.repo,
          issue_number: this.context.payload.pull_request.number,
          body: message
        })
      } else {
        core.debug(`Previous comment found, updating...`)
        response = await this.octokit.rest.issues.updateComment({
          ...this.context.repo,
          comment_id: previousComments[0].id,
          body: `<p>${message}Last Update @ ${new Date().toUTCString()}<p>`
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
      comment.body?.includes(this.getHtmlTitle())
    )
  }

  private getHtmlTitle(): string {
    return html.p(
      {'data-id': this.context.payload.pull_request?.id},
      this.getTitle()
    )
  }

  private getTitle(): string {
    const customTitle = this.title ? ` | ${this.title}` : ''
    return `Test Coverage Report${customTitle}`
  }
}
