import * as core from '@actions/core'

export function getInputAsArray(
  name: string,
  options?: core.InputOptions
): string[] {
  return core
    .getInput(name, options)
    .split('\n')
    .map(s => s.trim())
    .filter(x => x !== '')
}

export function getInputAsBoolean(
  name: string,
  options?: core.InputOptions
): boolean {
  return core.getInput(name, options).toLowerCase() === 'true'
}

export function getInputAsNumber(
  name: string,
  options?: core.InputOptions
): number {
  return Number.parseFloat(core.getInput(name, options))
}
