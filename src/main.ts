import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token', {required: true})
    const octokit = github.getOctokit(token)

    const message = 'Hello GitHub'

    core.debug('Posting message to github: \n' + message)
    octokit.rest.issues.createComment({
      repo: github.context.repo.repo,
      owner: github.context.repo.owner,
      issue_number: github.context.payload.pull_request?.number || 0,
      body: message
    })
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
