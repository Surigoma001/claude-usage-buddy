import { test, expect } from 'claude-code/testing'

const base = { hasSurvey: false, isWorking: false, maxRows: 10, columns: 100 }

// 測定が来る前・狭すぎる幅は、エンジンに譲って何も描かない（ツリーが拒否されない）
for (const bodyColumns of [6, 9, 60]) {
  test(`yields cleanly at ${bodyColumns} columns before a measurement`, async ($, on) => {
    on('ui.render', ($$, e) => {
      const { Text } = $$.ui.resolve(e)
      return <Text>engine band</Text>
    })
    const ui = await $.ui.mount({
      plugin: 'usage-buddy',
      surface: 'terminal',
      component: 'AbovePrompt',
      props: { ...base, bodyColumns },
    } as never)
    expect(await ui.find({ type: 'Text', text: /engine band/ })).toBeDefined()
    await ui.unmount()
  })
}
