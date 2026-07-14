import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

// Bilingual keyword-based response engine — works entirely client-side.
const MARKER_HINTS = ['cea', 'ca-125', 'ca125', 'psa', 'afp', 'marker', 'مؤشر', 'تحليل', 'نتيجة', 'range', 'نطاق', 'test', 'فحص']
const HOW_HINTS = ['how', 'use', 'upload', 'scan', 'work', 'كيف', 'استخدام', 'رفع', 'مسح']
const WHAT_HINTS = ['what', 'detecta', 'detectoma', 'app', 'ما هو', 'ماهو', 'التطبيق', 'about']
const RESULT_HINTS = ['result', 'report', 'flag', 'elevated', 'normal', 'نتيجة', 'تقرير', 'مرتفع', 'طبيعي']
const GREETING = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'مرحبا', 'السلام', 'اهلا', 'صباح', 'مساء']
const THANKS = ['thank', 'thanks', 'شكر', 'شكرا']

const RESPONSES = {
  en: {
    greeting: "Hi there! 👋 I'm the DETECTA assistant. I can help explain lab markers, reference ranges, and how to use the app. What would you like to know?",
    marker: "Lab markers like CEA, CA-125, PSA, and AFP are proteins measured in blood tests. A value within the reference range is generally reassuring. Elevated values can have many causes — not just cancer. DETECTA flags values worth discussing with your doctor. Remember: only a qualified doctor can interpret your results. 🩺",
    howto: "Using DETECTA is simple:\n\n1️⃣ **Upload** your lab report (photo or PDF)\n2️⃣ **Review** the extracted values\n3️⃣ **Get insights** — DETECTA highlights markers to discuss with your doctor\n\nRemember: DETECTA is a screening aid, not a diagnosis.",
    whatIs: "DETECTA is a bilingual (English/Arabic) lab-report screening aid. It helps you understand your blood test results by highlighting markers that may need attention. It's NOT a diagnostic tool — always follow up with a healthcare professional. 🏥",
    results: "Your results show markers flagged by our screening algorithm. 'Normal' means within standard reference ranges. 'Elevated' means the value is above typical ranges — but this doesn't necessarily mean something is wrong. Many factors can affect marker levels. Please discuss any flagged results with your doctor.",
    thanks: "You're welcome! 😊 Feel free to ask anything else about your lab markers or how to use DETECTA.",
    fallback: "I can help with:\n• **Lab markers** — CEA, PSA, CA-125, AFP\n• **Reference ranges** — what's normal\n• **How to use DETECTA** — uploading reports\n• **Understanding results**\n\nFor specific health concerns, please consult your doctor — DETECTA is a screening aid, not a diagnosis. 💡",
  },
  ar: {
    greeting: "مرحبًا! 👋 أنا مساعد ديتكتا. يمكنني شرح مؤشرات المختبر والنطاقات المرجعية وكيفية استخدام التطبيق. بماذا تحب أن أساعدك؟",
    marker: "مؤشرات المختبر مثل CEA وCA-125 وPSA وAFP هي بروتينات تُقاس في فحوصات الدم. القيمة ضمن النطاق المرجعي مطمئنة عمومًا. القيم المرتفعة قد يكون لها أسباب كثيرة — ليست السرطان فقط. يشير ديتكتا إلى القيم التي تستحق نقاشها مع طبيبك. تذكّر: الطبيب المختص وحده من يفسّر نتائجك. 🩺",
    howto: "استخدام ديتكتا بسيط:\n\n1️⃣ **ارفع** تقرير المختبر (صورة أو PDF)\n2️⃣ **راجع** القيم المستخرجة\n3️⃣ **احصل على رؤى** — ديتكتا يبرز المؤشرات لمناقشتها مع طبيبك\n\nتذكّر: ديتكتا أداة فحص أولي وليست تشخيصًا.",
    whatIs: "ديتكتا هو أداة فحص أولي ثنائية اللغة (عربي/إنجليزي) لتقارير المختبر. يساعدك على فهم نتائج فحوصات الدم من خلال إبراز المؤشرات التي قد تحتاج اهتمامًا. ليست أداة تشخيصية — استشر دائمًا متخصصًا في الرعاية الصحية. 🏥",
    results: "نتائجك تُظهر مؤشرات أشار إليها نظام الفحص. 'طبيعي' يعني ضمن النطاقات المرجعية. 'مرتفع' يعني أن القيمة أعلى من النطاقات المعتادة — لكن هذا لا يعني بالضرورة وجود مشكلة. عوامل كثيرة تؤثر على مستويات المؤشرات. يُرجى مناقشة أي نتائج مرتفعة مع طبيبك.",
    thanks: "على الرحب والسعة! 😊 لا تتردد في السؤال عن أي شيء آخر حول مؤشرات المختبر أو كيفية استخدام ديتكتا.",
    fallback: "يمكنني المساعدة في:\n• **مؤشرات المختبر** — CEA، PSA، CA-125، AFP\n• **النطاقات المرجعية** — ما هو الطبيعي\n• **كيفية استخدام ديتكتا** — رفع التقارير\n• **فهم النتائج**\n\nلأي أمر يخص صحتك تحديدًا، يُرجى مراجعة طبيب — ديتكتا أداة فحص أولي وليست تشخيصًا. 💡",
  },
}

function detectLang(text) {
  return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en'
}

function getReply(text) {
  const lang = detectLang(text)
  const low = text.toLowerCase().trim()
  const bank = RESPONSES[lang]

  if (GREETING.some((g) => low.includes(g))) return bank.greeting
  if (THANKS.some((g) => low.includes(g))) return bank.thanks
  if (MARKER_HINTS.some((h) => low.includes(h))) return bank.marker
  if (HOW_HINTS.some((h) => low.includes(h))) return bank.howto
  if (WHAT_HINTS.some((h) => low.includes(h))) return bank.whatIs
  if (RESULT_HINTS.some((h) => low.includes(h))) return bank.results
  return bank.fallback
}

// Floating chat assistant. Works entirely client-side with built-in responses.
export default function ChatWidget() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  // Seed the greeting the first time the panel opens.
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: t('chat.greeting') }])
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, busy])

  const send = async (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setMessages((m) => [...m, { role: 'user', content: text }])
    setInput('')
    setBusy(true)

    // Simulate typing delay for natural feel
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800))

    const reply = getReply(text)
    setMessages((m) => [...m, { role: 'assistant', content: reply }])
    setBusy(false)
  }

  return (
    <>
      <button
        className={`chat-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t('chat.close') : t('chat.open')}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" /></svg>
        )}
      </button>

      {open && (
        <div className="chat-panel card-glass" role="dialog" aria-label={t('chat.title')}>
          <div className="chat-head">
            <span className="chat-avatar">◎</span>
            <div>
              <strong>{t('chat.title')}</strong>
              <div className="muted small">{t('chat.subtitle')}</div>
            </div>
          </div>

          <div className="chat-body" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>
            ))}
            {busy && <div className="chat-msg assistant chat-typing"><span /><span /><span /></div>}
          </div>

          <form className="chat-input" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              aria-label={t('chat.placeholder')}
            />
            <button type="submit" className="chat-send" disabled={busy || !input.trim()} aria-label={t('chat.send')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  )
}
