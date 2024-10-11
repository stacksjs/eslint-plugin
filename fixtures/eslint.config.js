import antfu from '@stacksjs/eslint-config'
import unocss  from '@stacksjs/eslint-plugin'

export default antfu(
  {
    unocss: false,
    svelte: true
  },
  unocss.configs.flat,
  {
    rules: {
      'unocss/blocklist': 'error',
    }
  }
)
