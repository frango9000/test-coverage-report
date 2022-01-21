import {fragment, html} from '../src/html'

describe('Html String Builder', () => {
  it('build html elements', () => {
    for (const key of Object.keys(html)) {
      expect(html[key]('content')).toBe(`<${key}>content</${key}>`)
      expect(html[key]('con', 'tent')).toBe(`<${key}>content</${key}>`)
    }
  })

  it('html fragment should return the children', () => {
    expect(fragment()).toBe('')
    expect(fragment('con')).toBe('con')
    expect(fragment('con', 'tent')).toBe('content')
  })

  it('html tags should accept properties', () => {
    expect(html.a({href: 'http://www.example.com'}, 'example')).toBe(
      "<a href='http://www.example.com'>example</a>"
    )
    expect(
      html.a({href: 'http://www.example.com', target: '_blank'}, 'example')
    ).toBe("<a href='http://www.example.com' target='_blank'>example</a>")
  })
})
