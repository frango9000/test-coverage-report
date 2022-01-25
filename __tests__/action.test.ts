import * as core from '@actions/core'
import {Action} from '../src/action'

describe('Action', () => {
  let action: Action

  it('should create', () => {
    jest.spyOn(core, 'getInput').mockReturnValue('input')
    action = new Action()
    expect(action).toBeTruthy()
  })
})
