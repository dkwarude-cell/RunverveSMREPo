/**
 * ChatMarkdown - renders the assistant's markdown reply in a chat bubble.
 * Forgiving on purpose: handles **bold**, *italic*, `code`, [links](url), headings, "-" / "*" / "•" bullets
 * (with nesting), numbered lists, simple tables and dividers, and removes any stray * or ** the model leaves.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, useTheme } from '../../theme';
import type { Palette } from '../../theme';

type Seg = { text: string; bold?: boolean; italic?: boolean; code?: boolean };
type Block =
  | { kind: 'gap' }
  | { kind: 'divider' }
  | { kind: 'heading'; segs: Seg[] }
  | { kind: 'para'; segs: Seg[] }
  | { kind: 'bullet'; level: number; segs: Seg[] }
  | { kind: 'number'; level: number; n: string; segs: Seg[] }
  | { kind: 'table'; rows: Seg[][][] };

/** Removes markdown symbols that are left over after parsing. */
const clean = (s: string) =>
  s
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/(^|[^\d])\*(?!\d)/g, '$1') // stray * (keeps 2*3)
    .replace(/`/g, '')
    .replace(/ {2,}/g, ' ');

/** Inline markdown -> styled segments (no look-behind, works on every JS engine). */
function inline(src: string): Seg[] {
  const line = src.replace(/\[([^\]]+)\]\((?:https?:\/\/|www\.)[^)]+\)/g, '$1'); // [text](url) -> text
  const out: Seg[] = [];
  const re = /\*\*([^\n]+?)\*\*|__([^\n]+?)__|`([^`\n]+)`|(^|[\s(])\*(?!\s)([^*\n]+?)\*(?=[\s.,;:!?)]|$)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    let start = m.index;
    if (m[5] !== undefined) start += m[4].length; // italic keeps its leading space
    if (start > last) out.push({ text: clean(line.slice(last, start)) });
    if (m[1] !== undefined || m[2] !== undefined) out.push({ text: clean(m[1] ?? m[2]), bold: true });
    else if (m[3] !== undefined) out.push({ text: m[3], code: true });
    else out.push({ text: clean(m[5]), italic: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push({ text: clean(line.slice(last)) });
  return out.filter(s => s.text.length > 0);
}

const indentOf = (raw: string) => raw.replace(/\t/g, '    ').match(/^ */)![0].length;

function parse(md: string): Block[] {
  const lines = (md || '').replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let table: Seg[][][] | null = null;

  const push = (b: Block) => {
    if (b.kind === 'gap' && (!blocks.length || blocks[blocks.length - 1].kind === 'gap')) return; // no double gaps
    blocks.push(b);
  };

  for (const raw of lines) {
    const line = raw.trim();

    // tables: | a | b |
    if (/^\|.*\|$/.test(line)) {
      if (/^\|?[\s:|-]+\|?$/.test(line)) continue; // |---|---| separator
      const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cl => inline(cl.trim()));
      if (!table) table = [];
      table.push(cells);
      continue;
    }
    if (table) {
      push({ kind: 'table', rows: table });
      table = null;
    }

    if (!line) {
      push({ kind: 'gap' });
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      push({ kind: 'divider' });
      continue;
    }
    const h = line.match(/^#{1,6}\s+(.*)$/);
    if (h) {
      push({ kind: 'heading', segs: inline(h[1]) });
      continue;
    }
    const level = indentOf(raw) >= 2 ? 1 : 0;
    const b = line.match(/^[-*•+●▪]\s+(.*)$/);
    if (b) {
      push({ kind: 'bullet', level, segs: inline(b[1]) });
      continue;
    }
    const n = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (n) {
      push({ kind: 'number', level, n: n[1], segs: inline(n[2]) });
      continue;
    }
    push({ kind: 'para', segs: inline(line) });
  }
  if (table) push({ kind: 'table', rows: table });
  while (blocks.length && blocks[blocks.length - 1].kind === 'gap') blocks.pop();
  return blocks;
}

export default function ChatMarkdown({ text }: { text: string }) {
  const { c } = useTheme();
  const styles = useMemo(() => makeStyles(c), [c]);
  const blocks = useMemo(() => parse(text), [text]);

  const Line = ({ segs, style }: { segs: Seg[]; style?: any }) => (
    <Text style={[styles.text, style]}>
      {segs.map((s, i) => (
        <Text key={i} style={[s.bold && styles.bold, s.italic && styles.italic, s.code && styles.code]}>
          {s.text}
        </Text>
      ))}
    </Text>
  );

  return (
    <View>
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'gap':
            return <View key={i} style={styles.gap} />;
          case 'divider':
            return <View key={i} style={styles.divider} />;
          case 'heading':
            return <Line key={i} segs={b.segs} style={styles.heading} />;
          case 'para':
            return <Line key={i} segs={b.segs} />;
          case 'bullet':
            return (
              <View key={i} style={[styles.row, b.level ? styles.nested : null]}>
                <View style={[styles.dot, b.level ? styles.dotSmall : null]} />
                <View style={styles.flex}>
                  <Line segs={b.segs} />
                </View>
              </View>
            );
          case 'number':
            return (
              <View key={i} style={[styles.row, b.level ? styles.nested : null]}>
                <Text style={[styles.text, styles.num]}>{b.n}.</Text>
                <View style={styles.flex}>
                  <Line segs={b.segs} />
                </View>
              </View>
            );
          case 'table':
            return (
              <View key={i} style={styles.table}>
                {b.rows.map((row, r) => (
                  <View key={r} style={[styles.tr, r > 0 && styles.trBorder]}>
                    {row.map((cell, k) => (
                      <View key={k} style={styles.td}>
                        <Line segs={cell} style={[styles.tdText, r === 0 && styles.bold]} />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    flex: { flex: 1, minWidth: 0 },
    text: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.text },
    bold: { fontWeight: '700', color: c.text },
    italic: { fontStyle: 'italic' },
    code: { fontFamily: 'monospace', fontSize: 13.5, backgroundColor: c.surfaceStrong },
    heading: { fontFamily: fonts.bold, fontWeight: '800', fontSize: 16, lineHeight: 22, marginTop: 2 },
    gap: { height: 8 },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.divider, marginVertical: 8 },
    row: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 2 },
    nested: { paddingLeft: 16 },
    dot: { width: 6, height: 6, borderRadius: 3, marginTop: 8, marginRight: 9, backgroundColor: c.primary },
    dotSmall: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.textMuted },
    num: { fontWeight: '700', color: c.primary, minWidth: 20, marginRight: 4 },
    table: { marginVertical: 6, borderRadius: 10, overflow: 'hidden', backgroundColor: c.background },
    tr: { flexDirection: 'row' },
    trBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.divider },
    td: { flex: 1, paddingHorizontal: 8, paddingVertical: 6 },
    tdText: { fontSize: 13, lineHeight: 18 },
  });