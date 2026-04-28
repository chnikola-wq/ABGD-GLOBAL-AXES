/*
 * Deformity Tutor — floating chatbot widget.
 *
 * Vanilla-JS port of the React `AiTutorWidget` from the reference repo
 * `chnikola-wq/osteo-clean-DO-NOT-DELETE` (src/main.jsx). The DOM
 * structure, Tailwind classes, expand/collapse behaviour, SSE consumer,
 * and MathMessage rendering (marked → markdown → KaTeX) are kept
 * functionally identical so the two apps share the same backend
 * contract (`/.netlify/functions/chat` returning text/event-stream
 * frames `{type:'text'|'reset'|'error'|'done', …}`).
 */

import { marked } from 'marked';
import katex from 'katex';

const ENDPOINT = '/.netlify/functions/chat';

const GREETING = {
    role: 'assistant',
    content: "Hello! I am your deformity-analysis tutor. Ask me how the Global (extrinsic) X→Z→Y rotation sequence differs from a classical intrinsic Eulerian (X→Y'→Z'') decomposition, why pure angulation produces Codman twist, or how a single-cut osteotomy axis is derived from Euler's theorem."
};

// -------------------------------------------------------------
// Markdown + LaTeX rendering for assistant bubbles.
// Mirrors the reference repo's `MathMessage`: extract LaTeX
// tokens first ($$...$$ then $...$), run marked over the rest,
// then restore each token via KaTeX.
// -------------------------------------------------------------
function renderAssistantHTML(content) {
    if (!content) return '';

    const tokens = [];
    let s = content;

    // Display math $$...$$
    s = s.replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => {
        const idx = tokens.length;
        tokens.push({ math, display: true });
        return `\x00MATH${idx}\x00`;
    });
    // Inline math $...$
    s = s.replace(/\$((?:[^$\n]|\\\$)+?)\$/g, (_, math) => {
        const idx = tokens.length;
        tokens.push({ math, display: false });
        return `\x00MATH${idx}\x00`;
    });

    let rendered;
    try {
        rendered = marked.parse(s, { breaks: true, gfm: true });
    } catch (_) {
        rendered = `<p>${escapeHTML(s).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;
    }

    rendered = rendered.replace(/\x00MATH(\d+)\x00/g, (_, idxStr) => {
        const { math, display } = tokens[Number(idxStr)];
        try {
            return katex.renderToString(math, { throwOnError: false, displayMode: display });
        } catch (_) {
            return escapeHTML(math);
        }
    });

    return rendered;
}

function escapeHTML(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// -------------------------------------------------------------
// Widget — encapsulates DOM state. One instance is constructed
// at module load and inserted into #ai-tutor-mount (or document.body).
// -------------------------------------------------------------
function createWidget() {
    // Guard against double-initialisation (e.g. if the module is somehow
    // evaluated more than once by the bundler or the HTML has two entry
    // points that both reach this code).
    if (document.querySelector('[data-component="deformity-tutor"]')) return;

    const mount = document.getElementById('ai-tutor-mount') || document.body;

    // Container that holds the floating button + expanding panel.
    const root = document.createElement('div');
    root.className = 'fixed bottom-6 right-6 z-50 flex flex-col items-end';
    root.setAttribute('data-component', 'deformity-tutor');
    mount.appendChild(root);

    // ---- state ----
    let isOpen = false;
    let isExpanded = false;
    let isLoading = false;
    const messages = [GREETING];

    // ---- panel (only present while open) ----
    let panel = null;
    let messagesEl = null;
    let inputEl = null;
    let sendBtn = null;
    let loadingEl = null;
    let openBtn = null;

    function render() {
        // Clear and rebuild. Cheap — DOM is small (handful of bubbles).
        root.innerHTML = '';
        if (isOpen) {
            renderPanel();
        } else {
            renderOpenButton();
        }
    }

    function renderPanel() {
        const sizeClasses = isExpanded
            ? 'w-[min(680px,90vw)] h-[min(75vh,700px)]'
            : 'w-80 md:w-96 h-[450px]';
        panel = document.createElement('div');
        panel.className =
            'bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 mb-4 ' +
            'flex flex-col overflow-hidden fade-in transition-all duration-300 ' + sizeClasses;

        // Header
        const header = document.createElement('div');
        header.className =
            'bg-blue-600 p-4 text-white font-bold flex justify-between items-center gap-2 flex-shrink-0';
        const title = document.createElement('span');
        title.textContent = 'Deformity Tutor';
        header.appendChild(title);

        const headerBtns = document.createElement('div');
        headerBtns.className = 'flex items-center gap-2';

        const expandBtn = document.createElement('button');
        expandBtn.className = 'hover:text-blue-200 text-white/80 leading-none';
        expandBtn.title = isExpanded ? 'Collapse' : 'Expand';
        expandBtn.innerHTML = isExpanded
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
        expandBtn.addEventListener('click', () => {
            isExpanded = !isExpanded;
            render();
            requestAnimationFrame(scrollToBottom);
        });
        headerBtns.appendChild(expandBtn);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'hover:text-blue-200';
        closeBtn.textContent = '\u2715';
        closeBtn.setAttribute('aria-label', 'Close tutor');
        closeBtn.addEventListener('click', () => {
            isOpen = false;
            render();
        });
        headerBtns.appendChild(closeBtn);

        header.appendChild(headerBtns);
        panel.appendChild(header);

        // Messages
        messagesEl = document.createElement('div');
        messagesEl.className =
            'flex-1 p-4 overflow-y-auto bg-slate-50 dark:bg-slate-900 space-y-3 min-h-0';
        renderMessages();
        panel.appendChild(messagesEl);

        // Input row
        const inputRow = document.createElement('div');
        inputRow.className =
            'p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex gap-2 flex-shrink-0';

        inputEl = document.createElement('input');
        inputEl.type = 'text';
        inputEl.placeholder = 'Ask a question...';
        inputEl.className =
            'flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 ' +
            'rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500';
        inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !isLoading) sendMessage();
        });
        inputRow.appendChild(inputEl);

        sendBtn = document.createElement('button');
        sendBtn.className =
            'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed';
        sendBtn.textContent = 'Send';
        sendBtn.disabled = isLoading;
        sendBtn.addEventListener('click', () => {
            if (!isLoading) sendMessage();
        });
        inputRow.appendChild(sendBtn);

        panel.appendChild(inputRow);

        root.appendChild(panel);

        // Focus input on open for keyboard-first users.
        requestAnimationFrame(() => {
            if (inputEl && !isLoading) inputEl.focus();
            scrollToBottom();
        });
    }

    function renderOpenButton() {
        openBtn = document.createElement('button');
        openBtn.className =
            'bg-blue-600 hover:bg-blue-700 text-white pl-5 pr-6 py-3.5 rounded-full shadow-xl ' +
            'ring-4 ring-blue-500/30 hover:ring-blue-500/40 transition-all hover:scale-105 ' +
            'flex items-center gap-2.5 font-bold text-sm md:text-base tracking-wide animate-pulse-slow';
        openBtn.setAttribute('aria-label', 'Open Deformity Tutor');
        openBtn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="inline-block mr-2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>' +
            '<span>Deformity Tutor</span>';
        openBtn.addEventListener('click', () => {
            isOpen = true;
            render();
        });
        root.appendChild(openBtn);
    }

    function renderMessages() {
        if (!messagesEl) return;
        messagesEl.innerHTML = '';
        messages.forEach((msg) => {
            const bubble = document.createElement('div');
            const isUser = msg.role === 'user';
            bubble.className =
                'text-sm p-3 rounded-xl max-w-[90%] ' +
                (isUser
                    ? 'bg-blue-600 text-white ml-auto rounded-br-none'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 mr-auto rounded-bl-none');

            const inner = document.createElement('div');
            if (isUser) {
                inner.textContent = msg.content;
            } else {
                inner.className = 'chat-prose';
                inner.innerHTML = renderAssistantHTML(msg.content);
            }
            bubble.appendChild(inner);
            messagesEl.appendChild(bubble);
        });

        if (isLoading) {
            loadingEl = document.createElement('div');
            loadingEl.className = 'text-xs text-slate-500 italic';
            loadingEl.textContent = 'Thinking and calculating...';
            messagesEl.appendChild(loadingEl);
        }

        // Sentinel for scroll
        const end = document.createElement('div');
        end.setAttribute('data-end', '');
        messagesEl.appendChild(end);
    }

    function scrollToBottom() {
        if (!messagesEl) return;
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function setLoading(v) {
        isLoading = v;
        if (sendBtn) sendBtn.disabled = v;
        renderMessages();
        scrollToBottom();
    }

    function appendMessage(msg) {
        messages.push(msg);
        renderMessages();
        scrollToBottom();
    }

    function updateLastAssistant(text) {
        // Find the last assistant message added during the current
        // streaming turn and update its content in place.
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'assistant') {
                messages[i] = { role: 'assistant', content: text };
                renderMessages();
                scrollToBottom();
                return;
            }
        }
    }

    async function sendMessage() {
        const text = (inputEl && inputEl.value || '').trim();
        if (!text) return;
        const userMsg = { role: 'user', content: text };
        appendMessage(userMsg);
        inputEl.value = '';
        setLoading(true);

        try {
            // Anthropic requires the first message to be from 'user'.
            // Drop any leading assistant messages (e.g. the display-only greeting).
            const apiMessages = messages.filter((m) => m.role !== 'system');
            const firstUserIdx = apiMessages.findIndex((m) => m.role === 'user');
            const trimmedMessages = firstUserIdx > 0 ? apiMessages.slice(firstUserIdx) : apiMessages;

            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: trimmedMessages }),
            });

            // Pre-stream errors come back as JSON / HTML — surface
            // both the HTTP status and a short body excerpt in the
            // bubble so the user sees something actionable.
            const contentType = response.headers.get('content-type') || '';
            if (!response.ok || !contentType.includes('text/event-stream')) {
                let detail = `\n\n*(HTTP ${response.status}${response.statusText ? ' ' + response.statusText : ''})*`;
                try {
                    const raw = await response.text();
                    let parsed = null;
                    try { parsed = JSON.parse(raw); } catch (_) {}
                    if (parsed && parsed.error) {
                        detail = `\n\n*(HTTP ${response.status}: ${parsed.error})*`;
                    } else if (raw && raw.trim()) {
                        const cleaned = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                        const excerpt = cleaned.length > 200 ? cleaned.slice(0, 200) + '\u2026' : cleaned;
                        if (excerpt) detail = `\n\n*(HTTP ${response.status}: ${excerpt})*`;
                    }
                    console.error('[chat] non-stream response', response.status, raw);
                } catch (_) {}
                appendMessage({ role: 'assistant', content: `Sorry, I encountered an error. Please try again.${detail}` });
                return;
            }

            // Append a placeholder we mutate as deltas arrive.
            let assistantText = '';
            appendMessage({ role: 'assistant', content: '' });

            const updateAssistant = (next) => {
                assistantText = next;
                updateLastAssistant(assistantText);
            };

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let streamErrorMessage = null;
            let sawDone = false;

            outer: while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                let frameEnd;
                while ((frameEnd = buffer.indexOf('\n\n')) !== -1) {
                    const rawFrame = buffer.slice(0, frameEnd);
                    buffer = buffer.slice(frameEnd + 2);

                    let dataPayload = '';
                    for (const line of rawFrame.split('\n')) {
                        if (line.startsWith('data: ')) dataPayload += line.slice(6);
                        else if (line.startsWith('data:')) dataPayload += line.slice(5);
                    }
                    if (!dataPayload) continue;

                    let evt;
                    try { evt = JSON.parse(dataPayload); } catch { continue; }

                    if (evt.type === 'text' && typeof evt.text === 'string') {
                        updateAssistant(assistantText + evt.text);
                    } else if (evt.type === 'reset') {
                        // Pre-tool-call reasoning we just streamed
                        // wasn't the final answer — clear the bubble
                        // and wait for the next streamed turn.
                        updateAssistant('');
                    } else if (evt.type === 'error') {
                        streamErrorMessage = evt.error || 'unknown error';
                        break outer;
                    } else if (evt.type === 'done') {
                        sawDone = true;
                        break outer;
                    }
                }
            }

            if (streamErrorMessage) {
                updateLastAssistant(`Sorry, I encountered an error. Please try again.\n\n*(${streamErrorMessage})*`);
            } else if (!sawDone && !assistantText) {
                updateLastAssistant('Sorry, I encountered an error. Please try again.\n\n*(empty response)*');
            }
        } catch (err) {
            console.error('[chat] network error', err);
            // Either the placeholder was added or it wasn't — handle both.
            const last = messages[messages.length - 1];
            if (last && last.role === 'assistant' && last.content === '') {
                updateLastAssistant('Network error. Please try again.');
            } else {
                appendMessage({ role: 'assistant', content: 'Network error. Please try again.' });
            }
        } finally {
            setLoading(false);
            if (inputEl) inputEl.focus();
        }
    }

    render();
}

// Mount once the DOM is ready. As an ES module this script is deferred,
// so DOMContentLoaded may already have fired — guard accordingly.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
} else {
    createWidget();
}
