import type { ReactNode } from 'react'

/**
 * Lightweight, safe renderer for assistant answers.
 *
 * The model is instructed to answer in short paragraphs with a few bullets.
 * This formatter turns those plain-text signals into gentle structure —
 * paragraphs, optional `**bold**` emphasis, and bullet/numbered lists — by
 * building React elements from a string. It never renders HTML, so there is
 * no injection surface: everything unmatched stays plain escaped text.
 */

interface ParagraphBlock {
  kind: 'paragraph'
  lines: string[]
}

interface ListBlock {
  kind: 'list'
  ordered: boolean
  items: string[]
}

type ContentBlock = ParagraphBlock | ListBlock

const EMPTY_LINE_RE = /^\s*$/
const BULLET_RE = /^\s*[-•*]\s+/
const NUMBERED_RE = /^\s*(\d{1,3})[.)]\s+/

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*.+?\*\*)/g)
  return parts.map((part, index) => {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-medium text-paper">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}

function renderBlock(block: ContentBlock, index: number): ReactNode {
  if (block.kind === 'list') {
    if (block.ordered) {
      return (
        <ol key={index} className="ml-5 space-y-1.5 list-decimal marker:text-dim">
          {block.items.map((item, i) => (
            <li key={i} className="pl-0.5">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      )
    }
    return (
      <ul key={index} className="space-y-1.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[0.62em] h-1 w-1 shrink-0 rounded-full bg-mist/70"
            />
            <span className="min-w-0">{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    )
  }
  return (
    <p key={index} className="min-w-0 leading-relaxed">
      {renderInline(block.lines.join('\n'))}
    </p>
  )
}

export function formatAssistantContent(text: string): ReactNode {
  const normalized = text.replace(/\r\n?/g, '\n').trim()
  if (!normalized) return text

  const blocks: ContentBlock[] = []
  let current: ContentBlock | null = null

  for (const line of normalized.split('\n')) {
    if (EMPTY_LINE_RE.test(line)) {
      current = null
      continue
    }

    const bullet = line.match(BULLET_RE)
    if (bullet) {
      const item = line.slice(bullet[0].length)
      if (current && current.kind === 'list' && !current.ordered) {
        current.items.push(item)
      } else {
        current = { kind: 'list', ordered: false, items: [item] }
        blocks.push(current)
      }
      continue
    }

    const numbered = line.match(NUMBERED_RE)
    if (numbered) {
      const item = line.slice(numbered[0].length)
      if (current && current.kind === 'list' && current.ordered) {
        current.items.push(item)
      } else {
        current = { kind: 'list', ordered: true, items: [item] }
        blocks.push(current)
      }
      continue
    }

    if (current && current.kind === 'paragraph') {
      current.lines.push(line)
    } else {
      current = { kind: 'paragraph', lines: [line] }
      blocks.push(current)
    }
  }

  return (
    <div className="space-y-2.5">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  )
}