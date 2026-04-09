import { ChatMessage } from '../types';

// ─── Markdown → clean HTML ───────────────────────────────────────────────────
function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^#{6} (.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5} (.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4} (.+)$/gm, '<h4>$1</h4>')
    .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
    .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
    .replace(/^#{1} (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---+$/gm, '')
    .replace(/^[ \t]*[-*•] (.+)$/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li data-n="$1">$2</li>');

  html = html.replace(/(<li[^>]*>[\s\S]*?<\/li>\n?)+/g, (block) => {
    if (block.includes('data-n=')) {
      return '<ol>' + block.replace(/ data-n="\d+"/g, '') + '</ol>';
    }
    return '<ul>' + block + '</ul>';
  });

  const segments = html.split(/\n{2,}/);
  html = segments.map(seg => {
    seg = seg.trim();
    if (!seg) return '';
    if (/^<(h[1-6]|ul|ol|hr|blockquote|pre|div)/.test(seg)) return seg;
    return `<p>${seg.replace(/\n/g, ' ')}</p>`;
  }).join('\n');

  return html;
}

// ─── Content Distillation Logic ───────────────────────────────────────────────

const FILLER_PHRASES = [
  /would you like to .*\?/gi,
  /do you feel .*\?/gi,
  /ready for a .*\?/gi,
  /does that make sense\?/gi,
  /great job!/gi,
  /congratulations!/gi,
  /hello!/gi,
  /i'm your ai tutor/gi,
  /let's move on/gi,
  /let's test your understanding/gi,
  /click the button below/gi,
  /i've created a learning roadmap/gi,
];

function cleanContent(text: string): string {
  let cleaned = text;
  // Remove common conversational start/end phrases
  cleaned = cleaned.replace(/^okay,? let's .*\n/gi, '');
  cleaned = cleaned.replace(/^great,? let's .*\n/gi, '');
  
  // Apply regex filters for filler phrases
  FILLER_PHRASES.forEach(regex => {
    cleaned = cleaned.replace(regex, '');
  });

  return cleaned.trim();
}

/**
 * Distills the chat into a module-centric grouped structure.
 * Deduplicates multiple explanations for the same topic.
 */
function distillMessagesByModule(chatMessages: ChatMessage[], syllabus: string[] | null): { title: string; body: string }[] {
  const content: { title: string; body: string }[] = [];
  const aiMessages = chatMessages.filter(m => m.sender === 'ai' && m.text.length > 80);
  
  if (!syllabus || syllabus.length === 0) {
    // If no syllabus, just group substantial messages
    const filtered = aiMessages.filter(m => !m.text.includes("Would you like"));
    if (filtered.length > 0) {
      content.push({
        title: "Session Highlights",
        body: cleanContent(filtered.map(m => m.text).join('\n\n'))
      });
    }
    return content;
  }

  // Map messages to modules based on the flow
  // Logic: We assume the last explanation for a module is the most accurate/refined one.
  const moduleMap = new Map<number, string>();
  
  // This is a heuristic: find substantial explanations that follow a "YES, I UNDERSTAND" or start a new module
  let currentModuleIdx = -1;
  
  for (let i = 0; i < chatMessages.length; i++) {
    const msg = chatMessages[i];
    
    // Detect module transition (heuristically)
    if (msg.sender === 'ai') {
        const text = msg.text.toLowerCase();
        // If the AI message is long, it's likely an explanation
        if (msg.text.length > 150) {
            // Find which module this likely belongs to
            // For now, we increment based on the order of successful understanding responses
            // This matches the current app state logic
            const likelyModuleIdx = content.length; 
            if (likelyModuleIdx < syllabus.length) {
                // If we already have something for this module, overwrite it (taking the latest retry/explanation)
                moduleMap.set(likelyModuleIdx, msg.text);
            }
        }
    }
  }

  // Build the final list from the map
  syllabus.forEach((title, idx) => {
    const rawText = moduleMap.get(idx);
    if (rawText) {
      content.push({
        title: title,
        body: cleanContent(rawText)
      });
    }
  });

  return content;
}

// ─── Main HTML builder ───────────────────────────────────────────────────────
function buildHtmlDocument(
  topic: string,
  chatMessages: ChatMessage[],
  syllabus: string[] | null
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const distilledContent = distillMessagesByModule(chatMessages, syllabus);

  let tocHtml = '';
  if (syllabus && syllabus.length > 0) {
    const items = syllabus.map((step, i) =>
      `<div class="toc-item">
        <div class="toc-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="toc-label">${step.toUpperCase()}</div>
      </div>`
    ).join('');
    tocHtml = `
      <section class="toc-section">
        <h2 class="toc-title">MODULE ARCHITECTURE</h2>
        <div class="toc-list">${items}</div>
      </section>`;
  }

  const sectionsHtml = distilledContent.map((item, i) => `
    <section class="content-section">
      <div class="content-step-badge">MODULE ${String(i + 1).padStart(2, '0')}</div>
      <h2 class="content-section-title">${item.title.toUpperCase()}</h2>
      <div class="content-body">${markdownToHtml(item.body)}</div>
    </section>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Study Guide – ${topic || 'Session'}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Instrument+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    @page { size: A4; margin: 25mm 20mm 25mm 20mm; }
    :root {
      --slate-50: #f8fafc;
      --slate-100: #f1f5f9;
      --slate-200: #e2e8f0;
      --slate-800: #1e293b;
      --slate-900: #0f172a;
      --emerald-600: #059669;
      --indigo-600: #4f46e5;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      font-family: 'Instrument Sans', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: var(--slate-900);
      background: #fff;
    }
    .cover {
      background: var(--slate-900);
      color: #fff;
      padding: 50px 40px;
      border-radius: 16px;
      margin-bottom: 50px;
    }
    .cover-meta {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      margin-bottom: 15px;
    }
    .cover-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 36pt;
      font-weight: 800;
      line-height: 1.1;
      text-transform: uppercase;
    }
    .cover-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid rgba(255,255,255,0.1);
      font-size: 8pt;
      font-weight: 700;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.1em;
    }
    .toc-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10pt;
      font-weight: 800;
      padding-bottom: 10px;
      border-bottom: 2px solid var(--slate-100);
      margin-bottom: 20px;
      letter-spacing: 0.1em;
    }
    .toc-item { display: flex; gap: 15px; margin-bottom: 10px; }
    .toc-num { color: var(--indigo-600); font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; }
    .toc-label { font-weight: 700; color: var(--slate-700); }
    
    .content-section { margin-bottom: 70px; page-break-inside: avoid; }
    .content-step-badge {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 8pt;
      font-weight: 800;
      color: var(--indigo-600);
      margin-bottom: 5px;
    }
    .content-section-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 24pt;
      font-weight: 800;
      margin-bottom: 25px;
      line-height: 1.1;
    }
    .content-body p { margin-bottom: 15px; text-align: justify; }
    .content-body h1, .content-body h2 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14pt;
      margin: 30px 0 15px;
      border-left: 3px solid var(--indigo-600);
      padding-left: 15px;
    }
    .content-body pre {
      background: var(--slate-900);
      color: #fff;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      font-size: 9pt;
      font-family: monospace;
    }
    .doc-footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid var(--slate-100);
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      font-weight: 700;
      color: var(--slate-300);
    }
  </style>
</head>
<body>
  <div style="page-break-after: always;">
    <div class="cover">
      <div class="cover-meta">PACE AI · STUDY ARCHIVE</div>
      <div class="cover-title">${topic || 'MASTERY SESSION'}</div>
      <div class="cover-footer">
        <span>${dateStr.toUpperCase()}</span>
        <span>VERSION 2.4</span>
      </div>
    </div>
    ${tocHtml}
  </div>
  ${sectionsHtml}
  <div class="doc-footer">
    <span>PACE AI · ADAPTIVE LEARNING ENGINE</span>
    <span>${dateStr.toUpperCase()}</span>
  </div>
  <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
</body>
</html>`;
}

export function exportStudyGuide(
  topic: string,
  chatMessages: ChatMessage[],
  syllabus: string[] | null
): void {
  const html = buildHtmlDocument(topic, chatMessages, syllabus);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups for this site to export the Study Guide as PDF.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
