import * as core from '@actions/core'
import {Action, findFiles} from '../src/action'

describe('Action', () => {
  let action: Action

  it('should create', () => {
    jest.spyOn(core, 'getInput').mockReturnValue('input')
    action = new Action()
    expect(action).toBeTruthy()
  })

  it('should find files using fast glob', () => {
    const files = findFiles(['**/ja*.xml', '__tests__/**/*.info'])
    expect(files).toEqual([
      '__tests__/__fixtures__/jacoco.xml',
      '__tests__/__fixtures__/lcov.info'
    ])
  })
})
