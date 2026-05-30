import React, { useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Clipboard, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface MarkdownRendererProps {
  content: string
  colors: any
}

export function parseMarkdown(text: string) {
  const blocks: Array<{
    type: 'code' | 'table' | 'header' | 'list' | 'paragraph'
    content: string
    lang?: string
    level?: number
  }> = []
  const lines = text.split('\n')
  let inCode = false
  let codeContent: string[] = []
  let codeLang = ''
  let inTable = false
  let tableContent: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Fenced code block
    if (line.trim().startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code', content: codeContent.join('\n'), lang: codeLang })
        inCode = false
        codeContent = []
        codeLang = ''
      } else {
        inCode = true
        codeLang = line.trim().slice(3).trim()
      }
      continue
    }

    if (inCode) {
      codeContent.push(line)
      continue
    }

    // Table block
    if (line.trim().startsWith('|')) {
      inTable = true
      tableContent.push(line)
      continue
    } else if (inTable) {
      blocks.push({ type: 'table', content: tableContent.join('\n') })
      inTable = false
      tableContent = []
    }

    // Headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (headerMatch) {
      blocks.push({ type: 'header', content: headerMatch[2], level: headerMatch[1].length })
      continue
    }

    // Lists
    const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)
    if (listMatch) {
      blocks.push({ type: 'list', content: listMatch[3] })
      continue
    }

    // Empty lines
    if (line.trim() === '') {
      continue
    }

    blocks.push({ type: 'paragraph', content: line })
  }

  // Flush remaining
  if (inCode && codeContent.length > 0) {
    blocks.push({ type: 'code', content: codeContent.join('\n'), lang: codeLang })
  }
  if (inTable && tableContent.length > 0) {
    blocks.push({ type: 'table', content: tableContent.join('\n') })
  }

  return blocks
}

function renderInlineStyles(text: string, colors: any) {
  // Split on bold (**text**) or inline code (`code`)
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g)
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <Text key={i} style={[styles.boldText, { color: colors.text }]}>
          {token.slice(2, -2)}
        </Text>
      )
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <Text
          key={i}
          style={[
            styles.inlineCodeText,
            {
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderColor: colors.border,
              color: '#00FFCC',
            },
          ]}
        >
          {` ${token.slice(1, -1)} `}
        </Text>
      )
    }
    return (
      <Text key={i} style={{ color: colors.text + 'D9' }}>
        {token}
      </Text>
    )
  })
}

function CodeBlock({ content, lang, colors }: { content: string; lang?: string; colors: any }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    Clipboard.setString(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <View style={[styles.codeBlock, { borderColor: colors.border }]}>
      <View style={[styles.codeHeader, { backgroundColor: colors.surfaceHover, borderBottomColor: colors.border }]}>
        <Text style={[styles.codeLang, { color: colors.textMuted }]}>{lang || 'code'}</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={14} color={copied ? '#10B981' : colors.textMuted} />
          <Text style={[styles.copyBtnText, { color: copied ? '#10B981' : colors.textMuted }]}>
            {copied ? 'تم النسخ' : 'نسخ'}
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.codeScroll}>
        <Text style={[styles.codeText, { color: '#00FFCC' }]}>{content}</Text>
      </ScrollView>
    </View>
  )
}

function TableRenderer({ content, colors }: { content: string; colors: any }) {
  const lines = content.split('\n')
  const rows = lines.map((line) => {
    let cells = line.split('|').map((cell) => cell.trim())
    if (cells[0] === '') cells.shift()
    if (cells[cells.length - 1] === '') cells.pop()
    return cells
  })
  const validRows = rows.filter((row) => row.length > 0 && !row.every((cell) => /^:-+|-+:|:-+:|-+$/.test(cell)))

  if (validRows.length === 0) return null

  const headers = validRows[0]
  const bodyRows = validRows.slice(1)

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScroll}>
      <View style={[styles.tableContainer, { borderColor: colors.border }]}>
        {/* Header Row */}
        <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: colors.surfaceHover, borderBottomColor: colors.border }]}>
          {headers.map((h, i) => (
            <View key={i} style={[styles.tableCell, { borderLeftColor: colors.border }]}>
              <Text style={[styles.tableHeaderText, { color: colors.text }]}>
                {renderInlineStyles(h, colors)}
              </Text>
            </View>
          ))}
        </View>
        {/* Body Rows */}
        {bodyRows.map((row, ri) => (
          <View key={ri} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            {row.map((cell, ci) => (
              <View key={ci} style={[styles.tableCell, { borderLeftColor: colors.border }]}>
                <Text style={[styles.cellText, { color: colors.text + 'D9' }]}>
                  {renderInlineStyles(cell, colors)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

export default function MarkdownRenderer({ content, colors }: MarkdownRendererProps) {
  const blocks = parseMarkdown(content)

  return (
    <View style={styles.container}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'header': {
            const fontSize = block.level === 1 ? 22 : block.level === 2 ? 19 : 17
            return (
              <Text
                key={idx}
                style={[
                  styles.headerText,
                  {
                    fontSize,
                    color: colors.text,
                    marginTop: 14,
                    marginBottom: 6,
                  },
                ]}
              >
                {renderInlineStyles(block.content, colors)}
              </Text>
            )
          }
          case 'code':
            return <CodeBlock key={idx} content={block.content} lang={block.lang} colors={colors} />
          case 'table':
            return <TableRenderer key={idx} content={block.content} colors={colors} />
          case 'list':
            return (
              <View key={idx} style={styles.listItem}>
                <View style={[styles.listBullet, { backgroundColor: colors.textMuted }]} />
                <Text style={[styles.listText, { color: colors.text + 'D9' }]}>
                  {renderInlineStyles(block.content, colors)}
                </Text>
              </View>
            )
          case 'paragraph':
          default:
            return (
              <Text key={idx} style={[styles.paragraphText, { color: colors.text + 'D9' }]}>
                {renderInlineStyles(block.content, colors)}
              </Text>
            )
        }
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  boldText: {
    fontWeight: '800',
  },
  inlineCodeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 4,
  },
  headerText: {
    fontWeight: '700',
    textAlign: 'right',
  },
  paragraphText: {
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'right',
    marginVertical: 4,
  },
  listItem: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    marginVertical: 3,
    paddingRight: 8,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginLeft: 8,
    opacity: 0.6,
  },
  listText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'right',
  },
  
  // Code block styles
  codeBlock: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 10,
    backgroundColor: '#0a0e17',
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  codeLang: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 6,
  },
  copyBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  codeScroll: {
    padding: 12,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13.5,
    lineHeight: 18,
    textAlign: 'left',
  },

  // Table styles
  tableScroll: {
    marginVertical: 10,
  },
  tableContainer: {
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  tableHeader: {
    borderBottomWidth: 1,
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 140,
    maxWidth: 250,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
  },
  tableHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cellText: {
    fontSize: 13,
    textAlign: 'center',
  },
})
