import blocklist from './rules/blocklist'
import enforceClassCompile from './rules/enforce-class-compile'
import order from './rules/order'
import orderAttributify from './rules/order-attributify'

export const plugin = {
  rules: {
    blocklist,
    'enforce-class-compile': enforceClassCompile,
    order,
    'order-attributify': orderAttributify,
  },
}
