import * as core from '@actions/core'
import * as github from '@actions/github'
import {Context} from '@actions/github/lib/context'
import {GitHub} from '@actions/github/lib/utils'

export class Action {
  readonly token = core.getInput('token', {required: true})
  readonly title = core.getInput('title')
  readonly octokit: InstanceType<typeof GitHub>
  readonly context: Context

  constructor() {
    this.octokit = github.getOctokit(this.token)
    this.context = github.context

    core.debug(JSON.stringify(this.context))
  }

  async postComment(message: string): Promise<void> {
    core.debug(`Posting message to github:\n${message}`)
    if (this.context.eventName === 'pull_request') {
      await this.postPullRequestComment(message)
    } else if (this.context.eventName === 'push') {
      await this.postCommitComment(message)
    }
  }

  private async postCommitComment(message: string): Promise<void> {
    const resp = await this.octokit.rest.repos.createCommitComment({
      repo: this.context.repo.repo,
      owner: this.context.repo.owner,
      commit_sha: this.context.sha,
      body: message
    })
    core.debug(`Message URL: ${resp.data.url}`)
    core.debug(`Message HTML: ${resp.data.html_url}`)
  }

  private async postPullRequestComment(message: string): Promise<void> {
    message += this.getPullRequestStamp()
    if (this.context.payload.pull_request?.number) {
      const resp = await this.octokit.rest.issues.createComment({
        repo: this.context.repo.repo,
        owner: this.context.repo.owner,
        issue_number: this.context.payload.pull_request.number,
        body: message
      })

      core.debug(`Post message status: ${resp.status}`)
      core.debug(`Issue URL: ${resp.data.issue_url}`)
      core.debug(`Message URL: ${resp.data.url}`)
      core.debug(`Message HTML: ${resp.data.html_url}`)
    }
  }

  private getPullRequestStamp(): string {
    return `<p hidden [data-pr-id='${this.context.payload.pull_request?.id}']>${this.title}</p>`
  }
}
