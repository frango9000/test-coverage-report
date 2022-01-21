import * as core from '@actions/core'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'

export class Action {
  readonly token = core.getInput('token', {required: true})
  readonly title = core.getInput('title')
  readonly disableComment =
    core.getInput('disable-comment', {required: true}).toLowerCase() === 'true'
  readonly octokit: InstanceType<typeof GitHub>
  readonly context: Context

  constructor() {
    this.octokit = github.getOctokit(this.token)
    this.context = github.context

    core.debug(JSON.stringify(this.context))
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

  private async postCommitComment(message: string): Promise<void> {
    const resp = await this.octokit.rest.repos.createCommitComment({
      repo: this.context.repo.repo,
      owner: this.context.repo.owner,
      commit_sha: this.context.sha,
      body: message
    })
    core.debug(`Comment URL: ${resp.data.url}`)
    core.debug(`Comment HTML: ${resp.data.html_url}`)
  }

  private async postPullRequestComment(message: string): Promise<void> {
    if (this.context.payload.pull_request?.number) {
      message = this.getCommentTitle() + message
      let response
      const previousComments = await this.listPreviousComments()
      if (!previousComments.length) {
        core.debug(`No previous comments found, creating a new one...`)
        response = await this.octokit.rest.issues.createComment({
          repo: this.context.repo.repo,
          owner: this.context.repo.owner,
          issue_number: this.context.payload.pull_request.number,
          body: message
        })
      } else {
        core.debug(`Previous comment found, updating...`)
        response = await this.octokit.rest.issues.updateComment({
          repo: this.context.repo.repo,
          owner: this.context.repo.owner,
          comment_id: previousComments[0].id,
          body: `${message}\n\nLast Update @ ${new Date().toTimeString()}`
        })
      }
      if (previousComments.length > 1) {
        const surplusComments = previousComments.slice(1)
        if (surplusComments.length)
          core.debug(`Removing surplus comments. (${surplusComments.length}`)
        for (const comment of surplusComments) {
          await this.octokit.rest.issues.deleteComment({
            repo: this.context.repo.repo,
            owner: this.context.repo.owner,
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
          repo: this.context.repo.repo,
          owner: this.context.repo.owner,
          issue_number: this.context.payload.pull_request?.number,
          page,
          per_page
        })
        results = [...results, ...response.data]
        page++
      } while (response.data.length === per_page)
    }
    return results.filter(comment =>
      comment.body?.includes(this.getCommentTitle())
    )
  }

  private getCommentTitle(): string {
    const titleString = this.title ? ` | ${this.title}` : ''
    return `<p [data-pr-id='${this.context.payload.pull_request?.id}']>Coverage Report${titleString}</p>\n`
  }
}

interface IssueComment {
  id: number
  body?: string
  html_url: string
  issue_url: string
  url: string
}
