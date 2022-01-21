export type Children = string | {[attributeName: string]: string}

function tag(name: string) {
  return (...children: Children[]): string => {
    let props = ''
    const firstChild = children[0]
    if (typeof firstChild === 'object') {
      props = Object.keys(firstChild)
        .map(key => ` ${key}='${firstChild[key]}'`)
        .join('')
    }

    const content =
      typeof firstChild === 'string' ? children : children.slice(1)

    return `<${name}${props}>${content.join('')}</${name}>`
  }
}

export function fragment(...children: Children[]): string {
  return children.join('')
}

export const a = tag('a')
export const p = tag('p')
export const b = tag('b')
export const div = tag('div')
export const span = tag('span')
export const h1 = tag('h1')
export const h2 = tag('h2')
export const h3 = tag('h3')
export const details = tag('details')
export const summary = tag('summary')
export const table = tag('table')
export const tbody = tag('tbody')
export const tr = tag('tr')
export const td = tag('td')

export const th = tag('th')

export const html: {
  [key: string]: (...children: Children[]) => string
} = {
  a,
  p,
  b,
  div,
  span,
  h1,
  h2,
  h3,
  details,
  summary,
  table,
  tbody,
  tr,
  td,
  th
}
