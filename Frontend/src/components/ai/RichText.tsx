/**
 * RichText.tsx - renders the parsed markdown (see utils/markdown.ts).
 *  Spans          : one line of text with bold / italic / code and coloured key words
 *  MarkdownBlocks : paragraphs, bullets, numbered items, sub-headings, tables, dividers
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../theme';
import type { AiColors } from '../../theme';
import type { Block, Span, Tone } from '../../utils/markdown';

const toneColor = (Colors: AiColors): Record<Tone, string> => ({
  good: Colors.success,
  warn: Colors.warning,
  bad: Colors.danger,
  mild: Colors.mild,
  moderate: Colors.moderate,
  severe: Colors.severe,
});

export function Spans({ spans, style }: { spans: Span[]; style?: any }) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const TONE_COLOR = toneColor(Colors);

  return (
    <Text style={style}>
      {spans.map((s, i) => (
        <Text
          key={i}
          style={[
            s.bold && styles.bold,
            s.italic && styles.italic,
            s.code && styles.code,
            s.tone && { color: TONE_COLOR[s.tone], fontWeight: '800' },
          ]}
        >
          {s.text}
        </Text>
      ))}
    </Text>
  );
}

export function MarkdownBlocks({ blocks, accent: accentProp }: { blocks: Block[]; accent?: string }) {
  const { ai: Colors } = useTheme();
  const styles = useMemo(() => makeStyles(Colors), [Colors]);
  const accent = accentProp ?? Colors.primary;
  return (
    <View>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'subheading':
            return <Spans key={i} spans={b.spans} style={[styles.subheading, { color: accent }]} />;
          case 'paragraph':
            return <Spans key={i} spans={b.spans} style={styles.paragraph} />;
          case 'bullet':
            return (
              <View key={i} style={[styles.row, { paddingLeft: b.level * 16 }]}>
                <View style={[b.level === 0 ? styles.dot : styles.dotSmall, { backgroundColor: accent }]} />
                <Spans spans={b.spans} style={styles.rowText} />
              </View>
            );
          case 'numbered':
            return (
              <View key={i} style={[styles.row, { paddingLeft: b.level * 16 }]}>
                <Text style={[styles.number, { color: accent }]}>{b.number}.</Text>
                <Spans spans={b.spans} style={styles.rowText} />
              </View>
            );
          case 'table':
            return (
              <View key={i} style={styles.table}>
                <View style={[styles.tr, styles.thead]}>
                  {b.header.map((c, j) => (
                    <Spans key={j} spans={c} style={[styles.td, styles.th]} />
                  ))}
                </View>
                {b.rows.map((r, k) => (
                  <View key={k} style={[styles.tr, k % 2 === 1 && styles.trAlt]}>
                    {r.map((c, j) => (
                      <Spans key={j} spans={c} style={styles.td} />
                    ))}
                  </View>
                ))}
              </View>
            );
          case 'divider':
            return <View key={i} style={styles.divider} />;
          default:
            return null;
        }
      })}
    </View>
  );
}

const makeStyles = (Colors: AiColors) =>
  StyleSheet.create({
  bold: {
    fontWeight: '700',
    color: Colors.text,
  },
  italic: {
    fontStyle: 'italic',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: Colors.surfaceAlt,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 14.5,
    lineHeight: 22,
    color: Colors.text,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    marginRight: 10,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 1,
    marginTop: 9,
    marginRight: 10,
    opacity: 0.6,
  },
  number: {
    fontSize: 14.5,
    lineHeight: 22,
    fontWeight: '700',
    marginRight: 8,
    minWidth: 16,
  },
  rowText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    color: Colors.text,
  },
  table: {
    borderRadius: 10,
    overflow: 'hidden',
    marginVertical: 8,
  },
  tr: {
    flexDirection: 'row',
  },
  thead: {
    backgroundColor: Colors.surfaceAlt,
  },
  trAlt: {
    backgroundColor: Colors.surfaceAlt,
  },
  td: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 13.5,
    color: Colors.text,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  th: {
    fontWeight: '700',
    borderTopWidth: 0,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
});
