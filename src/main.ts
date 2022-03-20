import * as core from '@actions/core'
import {Action} from './action'

async function run(): Promise<void> {
  try {
    const action = new Action()
    await action.run()
  } catch (error) {
    core.info(`${error}`)
  }
}

run()
