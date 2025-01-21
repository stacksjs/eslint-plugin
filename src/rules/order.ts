import type { TSESTree } from '@typescript-eslint/types'
import type { ESLintUtils } from '@typescript-eslint/utils'
import type { RuleListener } from '@typescript-eslint/utils/ts-eslint'
import { AST_NODES_WITH_QUOTES, CLASS_FIELDS } from '../constants'
import { createRule, syncAction } from './_'

export default createRule({
  create(context) {
    function checkLiteral(node: TSESTree.Literal) {
      if (typeof node.value !== 'string' || !node.value.trim())
        return
      const input = node.value
      const sorted = syncAction(
        context.settings.unocss?.configPath,
        'sort',
        input,
      ).trim()
      if (sorted !== input) {
        context.report({
          fix(fixer) {
            if (AST_NODES_WITH_QUOTES.includes(node.type))
              return fixer.replaceTextRange([node.range[0] + 1, node.range[1] - 1], sorted)
            else
              return fixer.replaceText(node, sorted)
          },
          messageId: 'invalid-order',
          node,
        })
      }
    }

    const scriptVisitor: RuleListener = {
      JSXAttribute(node) {
        if (typeof node.name.name === 'string' && CLASS_FIELDS.includes(node.name.name.toLowerCase()) && node.value) {
          if (node.value.type === 'Literal')
            checkLiteral(node.value)
        }
      },
      SvelteAttribute(node: any) {
        if (node.key.name === 'class') {
          if (node.value?.[0].type === 'SvelteLiteral')
            checkLiteral(node.value[0])
        }
      },
    }

    const templateBodyVisitor: RuleListener = {
      VAttribute(node: any) {
        if (node.key.name === 'class') {
          if (node.value.type === 'VLiteral')
            checkLiteral(node.value)
        }
      },
    }

    const parserServices = context?.sourceCode.parserServices || context.parserServices
    // @ts-expect-error missing-types
    if (parserServices == null || parserServices.defineTemplateBodyVisitor == null) {
      return scriptVisitor
    }
    else {
      // For Vue
      // @ts-expect-error missing-types
      return parserServices?.defineTemplateBodyVisitor(templateBodyVisitor, scriptVisitor)
    }
  },
  defaultOptions: [],
  meta: {
    docs: {
      description: 'Order of UnoCSS utilities in class attribute',
    },
    fixable: 'code',
    messages: {
      'invalid-order': 'UnoCSS utilities are not ordered',
    },
    schema: [],
    type: 'layout',
  },
  name: 'order',
}) as any as ESLintUtils.RuleWithMeta<[], ''>
