import type { TSESTree } from '@typescript-eslint/types'
import type { ESLintUtils } from '@typescript-eslint/utils'
import type { ReportFixFunction, RuleListener } from '@typescript-eslint/utils/ts-eslint'
import type { AST } from 'vue-eslint-parser'
import { createRule } from './_'

export default createRule<[{ prefix: string, enableFix: boolean }], 'missing'>({
  create(context, [mergedOptions]) {
    const CLASS_COMPILE_PREFIX = `${mergedOptions.prefix} `
    const ENABLE_FIX = mergedOptions.enableFix

    function report({ fix, node }: { node: AST.VNode | AST.ESLintNode, fix: ReportFixFunction }) {
      context.report({
        data: { prefix: CLASS_COMPILE_PREFIX.trim() },
        fix: (...args) => ENABLE_FIX ? fix(...args) : null,
        loc: node.loc,
        messageId: 'missing',
        node: node as unknown as TSESTree.Node,
      })
    }

    const scriptVisitor: RuleListener = {
      JSXAttribute(_node) {
        // todo: add support | NEED HELP
      },
      SvelteAttribute(_node: any) {
        // todo: add support | NEED HELP
      },
    }

    const reportClassList = (node: AST.VNode | AST.ESLintNode, classList: string) => {
      if (classList.startsWith(CLASS_COMPILE_PREFIX))
        return

      report({
        fix(fixer) {
          return fixer.replaceTextRange([node.range[0] + 1, node.range[1] - 1], `${CLASS_COMPILE_PREFIX}${classList}`)
        },
        node,
      })
    }

    const templateBodyVisitor: RuleListener = {
      [`VAttribute[key.argument.name=class] VExpressionContainer Literal:not(ConditionalExpression .test Literal):not(Property .value Literal)`](
        literal: AST.ESLintStringLiteral,
      ) {
        if (!literal.value || typeof literal.value !== 'string')
          return

        reportClassList(literal, literal.value)
      },
      [`VAttribute[key.argument.name=class] VExpressionContainer Property`](
        property: AST.ESLintProperty,
      ) {
        if (property.key.type !== 'Identifier')
          return

        const classListString = property.key.name
        if (classListString.startsWith(CLASS_COMPILE_PREFIX))
          return

        report({
          fix(fixer) {
            let replacePropertyKeyText = `'${CLASS_COMPILE_PREFIX}${classListString}'`

            if (property.shorthand)
              replacePropertyKeyText = `${replacePropertyKeyText}: ${classListString}`

            return fixer.replaceTextRange(property.key.range, replacePropertyKeyText)
          },
          node: property.key,
        })
      },
      [`VAttribute[key.argument.name=class] VExpressionContainer TemplateElement`](
        templateElement: AST.ESLintTemplateElement,
      ) {
        if (!templateElement.value.raw)
          return

        reportClassList(templateElement, templateElement.value.raw)
      },
      [`VAttribute[key.name=class]`](attr: AST.VAttribute) {
        const valueNode = attr.value
        if (!valueNode || !valueNode.value)
          return

        reportClassList(valueNode, valueNode.value)
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
  defaultOptions: [{ enableFix: true, prefix: ':uno:' }],
  meta: {
    docs: {
      description: 'Enforce class compilation',
    },
    fixable: 'code',
    messages: {
      missing: 'prefix: `{{prefix}}` is missing',
    },
    schema: [{
      additionalProperties: false,
      properties: {
        enableFix: {
          type: 'boolean',
        },
        prefix: {
          type: 'string',
        },
      },
      type: 'object',
    }],
    type: 'problem',
  },
  name: 'enforce-class-compile',
}) as any as ESLintUtils.RuleWithMeta<[], ''>
