import { findFiles, readFileSafe } from '../../utils/fs-utils.js'
import { extractComponents } from '../../utils/ast-utils.js'

export interface DocsGeneratorInput {
  componentName: string
}

export interface DocsGeneratorOutput {
  markdown: string
}

export async function docsGenerator(input: DocsGeneratorInput): Promise<DocsGeneratorOutput> {
  const { componentName } = input
  const files = findFiles(`src/**/*${componentName}*.{tsx,jsx}`)

  if (files.length === 0) {
    return { markdown: `# ${componentName}\n\nComponent not found.` }
  }

  const file = files[0]
  const code = readFileSafe(file)

  const markdown = `# ${componentName} Component

**Path:** \`${file}\`

## Usage

\`\`\`tsx
import { ${componentName} } from './${file.replace('src/', '').replace('.tsx', '')}'

<${componentName} />
\`\`\`

## Description

[Add description here]

## Props

[Props will be auto-generated based on TypeScript types]
`

  return { markdown }
}
