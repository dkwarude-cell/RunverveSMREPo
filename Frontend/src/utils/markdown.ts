/**
 * markdown.ts - turns the SmartHeal agent's markdown answer into structured data.
 *
 * Handles: numbered section titles ("1. Model Check", "1.  Model Check", "**1. Model Check**", "## Model Check"),
 * bullets (-, *, •, +) with indentation, numbered items, **bold**, __bold__, *italic*, _italic_, `code`,
 * markdown tables, dividers, stray asterisks, and the closing doctor disclaimer.
 */

export type Tone = 'good' | 'warn' | 'bad' | 'mild' | 'moderate' | 'severe';
export type Severity = 'mild' | 'moderate' | 'severe' | null;

export interface Span {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  tone?: Tone;
}

export type Block =
  | { kind: 'subheading'; spans: Span[] }
  | { kind: 'paragraph'; spans: Span[] }
  | { kind: 'bullet'; level: number; spans: Span[] }
  | { kind: 'numbered'; number: string; level: number; spans: Span[] }
  | { kind: 'table'; header: Span[][]; rows: Span[][][] }
  | { kind: 'divider' };

export type SectionKey =
  | 'model_check'
  | 'observations'
  | 'explanations'
  | 'severity'
  | 'next_steps'
  | 'devices'
  | 'warnings'
  | 'other';

export interface Section {
  key: SectionKey;
  title: string;
  blocks: Block[];
  rawLines: string[];
}

export interface ParsedAnalysis {
  intro: Block[];
  sections: Section[];
  disclaimer: string | null;
  severity: Severity;
}

// ───────────────────────────── helpers ─────────────────────────────
const SECTION_PATTERNS: [SectionKey, RegExp][] = [
  ['model_check', /model\s*check|verification/i],
  ['observations', /observation/i],
  ['explanations', /explanation/i],
  ['severity', /severity/i],
  ['next_steps', /next\s*step|self[-\s]?care/i],
  ['devices', /device|parameter/i],
  ['warnings', /warning|red\s*flag|medical\s*attention/i],
];

function sectionKeyFor(title: string): SectionKey | null {
  for (const [key, re] of SECTION_PATTERNS) {
    if (re.test(title)) return key;
  }
  return null;
}

/** Remove markdown emphasis characters, for plain-text checks. */
export function stripMarks(s: string): string {
  return s.replace(/\*\*|__|`/g, '').replace(/(^|\s)[*_](\S)/g, '$1$2').replace(/(\S)[*_](?=\s|$|[.,:;!?)])/g, '$1').trim();
}

const TONE_RE =
  /(\bNot recommended(?: at this time)?\b|\bDisagree[sd]?\b|\bAdjusted\b|\badjusted\b|\bUnclear\b|\bAgree[sd]?\b|\bConfirmed\b|\bmatches model\b)/g;
const SEVERITY_RE = /(\bMild\b|\bModerate\b|\bSevere\b)/gi;

function toneOf(word: string): Tone | undefined {
  const w = word.toLowerCase();
  if (w.startsWith('not recommended')) return 'bad';
  if (w.startsWith('disagree') || w === 'adjusted' || w === 'unclear') return 'warn';
  if (w.startsWith('agree') || w === 'confirmed' || w === 'matches model') return 'good';
  if (w === 'mild') return 'mild';
  if (w === 'moderate') return 'moderate';
  if (w === 'severe') return 'severe';
  return undefined;
}

/** Split spans further so key words get a colour. */
function applyTones(spans: Span[], withSeverity: boolean): Span[] {
  const out: Span[] = [];
  for (const s of spans) {
    if (s.code) {
      out.push(s);
      continue;
    }
    const re = withSeverity ? new RegExp(`${TONE_RE.source}|${SEVERITY_RE.source}`, 'gi') : new RegExp(TONE_RE.source, 'g');
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s.text)) !== null) {
      if (m.index > last) out.push({ ...s, text: s.text.slice(last, m.index) });
      out.push({ ...s, text: m[0], tone: toneOf(m[0]), bold: true });
      last = m.index + m[0].length;
    }
    if (last < s.text.length) out.push({ ...s, text: s.text.slice(last) });
  }
  return out.filter(s => s.text.length > 0);
}

/** Inline markdown -> spans. */
export function parseInline(line: string, withSeverity = false): Span[] {
  const spans: Span[] = [];
  // (no look-behind, so it also works on older JS engines)
  const re = /(\*\*[^*]+?\*\*|__[^_]+?__|`[^`]+?`)|(^|[^\w*])(\*(?![\s*])[^*\n]+?\*)(?![\w*])|(^|[^\w])(_(?![\s_])[^_\n]+?_)(?!\w)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const plain = (t: string) => t.replace(/\*{2,}/g, '').replace(/(^|\s)\*(?=\s|$)/g, '$1');
  while ((m = re.exec(line)) !== null) {
    let tok: string;
    let start: number;
    if (m[1]) {
      tok = m[1];
      start = m.index;
    } else if (m[3]) {
      tok = m[3];
      start = m.index + m[2].length;
    } else {
      tok = m[5];
      start = m.index + m[4].length;
    }
    if (start > last) spans.push({ text: plain(line.slice(last, start)) });
    if (tok.startsWith('**') || tok.startsWith('__')) spans.push({ text: tok.slice(2, -2), bold: true });
    else if (tok.startsWith('`')) spans.push({ text: tok.slice(1, -1), code: true });
    else spans.push({ text: tok.slice(1, -1), italic: true });
    last = start + tok.length;
  }
  if (last < line.length) spans.push({ text: plain(line.slice(last)) });
  // merge a bold label like "Body part:" so it reads nicely
  return applyTones(spans.filter(s => s.text.length > 0), withSeverity);
}

function splitRow(line: string): string[] {
  return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
}

// ───────────────────────────── main parser ─────────────────────────────
export function parseAnalysis(md: string): ParsedAnalysis {
  const lines = (md || '')
    .replace(/\r\n/g, '\n')
    .replace(/\bNo_Wound\b/g, 'No wound')
    .replace(/\bLaseration\b/g, 'Laceration')
    .split('\n');
  const intro: Block[] = [];
  const sections: Section[] = [];
  const disclaimerLines: string[] = [];
  let current: Section | null = null;
  let inDisclaimer = false;
  let tableBuf: string[] = [];
  const target = () => (current ? current.blocks : intro);

  const flushTable = () => {
    if (!tableBuf.length) return;
    const isSeparator = (r: string) => /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?$/.test(r);
    const rows = tableBuf.filter(r => !isSeparator(r));
    const withSev = current?.key === 'severity';
    if (rows.length) {
      const [head, ...body] = rows;
      target().push({
        kind: 'table',
        header: splitRow(head).map(c => parseInline(c, withSev)),
        rows: body.map(r => splitRow(r).map(c => parseInline(c, withSev))),
      });
    }
    tableBuf = [];
  };

  for (const raw of lines) {
    const line = raw.replace(/\t/g, '    ');
    const trimmed = line.trim();

    if (!trimmed) {
      flushTable();
      continue;
    }

    // disclaimer (may span two lines)
    if (/not a replacement for a doctor/i.test(trimmed) || (inDisclaimer && /consult/i.test(trimmed))) {
      flushTable();
      disclaimerLines.push(stripMarks(trimmed.replace(/^[-*•+]\s+/, '')).replace(/^"|"$/g, ''));
      inDisclaimer = true;
      continue;
    }
    inDisclaimer = false;

    // tables
    if (trimmed.startsWith('|') && trimmed.indexOf('|', 1) > 0) {
      tableBuf.push(trimmed);
      continue;
    }
    flushTable();

    // dividers
    if (/^([-*_])\s*\1\s*\1[\s\-*_]*$/.test(trimmed)) {
      target().push({ kind: 'divider' });
      continue;
    }

    // section titles
    const heading = trimmed.match(/^#{1,6}\s+(.*)$/);
    const numberedTitle = stripMarks(trimmed).match(/^(\d{1,2})[.)]\s+(.{2,70})$/);
    let title: string | null = null;
    if (heading) {
      title = stripMarks(heading[1]);
    } else if (numberedTitle && !/^[-*•+]/.test(trimmed)) {
      const t = numberedTitle[2].replace(/:$/, '').trim();
      if (sectionKeyFor(t) && t.split(/\s+/).length <= 8) title = t;
    }
    if (title) {
      const clean = title.replace(/^\d{1,2}[.)]\s+/, '').replace(/:$/, '').trim();
      current = { key: sectionKeyFor(clean) ?? 'other', title: clean, blocks: [], rawLines: [] };
      sections.push(current);
      continue;
    }

    if (current) current.rawLines.push(trimmed);
    const withSev = current?.key === 'severity';
    const indent = line.length - line.trimStart().length;
    const level = Math.min(2, Math.floor(indent / 4));

    // bullets
    const bullet = trimmed.match(/^[-*•+]\s+(.*)$/);
    if (bullet) {
      target().push({ kind: 'bullet', level, spans: parseInline(bullet[1], withSev) });
      continue;
    }

    // numbered items
    const num = trimmed.match(/^(\d{1,2})[.)]\s+(.*)$/);
    if (num) {
      target().push({ kind: 'numbered', number: num[1], level, spans: parseInline(num[2], withSev) });
      continue;
    }

    // a whole line in bold = sub-heading (e.g. **A. Heat Therapy Parameters**)
    if (/^\*\*[^*]+\*\*:?$/.test(trimmed) || /^__[^_]+__:?$/.test(trimmed)) {
      target().push({ kind: 'subheading', spans: [{ text: stripMarks(trimmed).replace(/:$/, ''), bold: true }] });
      continue;
    }

    target().push({ kind: 'paragraph', spans: parseInline(trimmed, withSev) });
  }
  flushTable();

  // make bullet indentation relative inside each section (AI sometimes indents everything)
  const normalise = (blocks: Block[]) => {
    const levels = blocks.filter(b => b.kind === 'bullet' || b.kind === 'numbered').map(b => (b as { level: number }).level);
    const base = levels.length ? Math.min(...levels) : 0;
    blocks.forEach(b => {
      if (b.kind === 'bullet' || b.kind === 'numbered') b.level = Math.max(0, b.level - base);
    });
  };
  normalise(intro);
  sections.forEach(s => normalise(s.blocks));

  // severity: highest level mentioned in the severity section
  let severity: Severity = null;
  const sevSection = sections.find(s => s.key === 'severity');
  if (sevSection) {
    const text = sevSection.rawLines.join(' ').toLowerCase();
    if (/\bsevere\b/.test(text)) severity = 'severe';
    else if (/\bmoderate\b/.test(text)) severity = 'moderate';
    else if (/\bmild\b/.test(text)) severity = 'mild';
  }

  return {
    intro,
    sections,
    disclaimer: disclaimerLines.length ? disclaimerLines.join(' ') : null,
    severity,
  };
}

// ───────────────────────────── device status ─────────────────────────────
export type DeviceKey = 'heat' | 'vibration' | 'tens';
export type DeviceStatus = 'confirmed' | 'adjusted' | 'not_recommended' | 'model';

export interface DeviceVerdict {
  status: DeviceStatus;
  notes: string[];
}

/** Reads section 6 to find, per device, whether the agent confirmed, adjusted or rejected the model's settings. */
export function deviceVerdicts(parsed: ParsedAnalysis): Record<DeviceKey, DeviceVerdict> {
  const result: Record<DeviceKey, DeviceVerdict> = {
    heat: { status: 'model', notes: [] },
    vibration: { status: 'model', notes: [] },
    tens: { status: 'model', notes: [] },
  };
  const section = parsed.sections.find(s => s.key === 'devices');
  if (!section) return result;

  const texts: Record<DeviceKey, string[]> = { heat: [], vibration: [], tens: [] };
  let currentDevice: DeviceKey | null = null;
  for (const raw of section.rawLines) {
    const line = stripMarks(raw.replace(/^[-*•+]\s+/, ''));
    const head = line.slice(0, 40).toLowerCase();
    const hits: [DeviceKey, number][] = [
      ['heat', head.search(/heat/)],
      ['vibration', head.search(/vibrat/)],
      ['tens', head.search(/\btens\b/)],
    ];
    const found = hits.filter(h => h[1] >= 0).sort((a, b) => a[1] - b[1]);
    if (found.length) currentDevice = found[0][0];
    if (currentDevice) texts[currentDevice].push(line);
  }

  (Object.keys(texts) as DeviceKey[]).forEach(dev => {
    const lines = texts[dev];
    if (!lines.length) return;
    const all = lines.join(' ');
    let status: DeviceStatus = 'confirmed';
    if (/not recommended/i.test(all)) status = 'not_recommended';
    else if (/\badjusted\b/i.test(all)) status = 'adjusted';
    const notes: string[] = [];
    if (status !== 'confirmed') {
      for (const l of lines) {
        const m = l.match(/\(adjusted:?\s*([^)]*)\)?/i);
        if (m && m[1].trim()) notes.push(m[1].trim().replace(/\.$/, ''));
        else if (/not recommended|adjusted/i.test(l)) {
          notes.push(l.replace(/^[A-C]\.\s*/, '').replace(/^[^:]{0,40}:\s*/, '').trim());
        }
      }
    }
    result[dev] = { status, notes: Array.from(new Set(notes)).slice(0, 2) };
  });
  return result;
}

// ───────────────────────────── model check verdicts ─────────────────────────────
export interface ModelCheck {
  bodyPart?: { agree: boolean; text: string };
  wound?: { agree: boolean; text: string };
  swelling?: string;
  therapy?: string;
}

export function modelCheck(parsed: ParsedAnalysis): ModelCheck {
  const section = parsed.sections.find(s => s.key === 'model_check');
  const out: ModelCheck = {};
  if (!section) return out;
  for (const raw of section.rawLines) {
    const line = stripMarks(raw.replace(/^[-*•+]\s+/, ''));
    const after = line.replace(/^[^:]*:\s*/, '');
    const agree = !/disagree/i.test(line);
    if (/^body\s*part/i.test(line)) out.bodyPart = { agree, text: after };
    else if (/^wound/i.test(line)) out.wound = { agree, text: after };
    else if (/^swelling/i.test(line)) out.swelling = after;
    else if (/^therapy/i.test(line)) out.therapy = after;
  }
  return out;
}
