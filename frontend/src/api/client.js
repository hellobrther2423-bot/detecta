// STANDALONE DEMO BACKEND — everything runs in the browser via localStorage.
// No server. Each visitor's data lives only in their own browser.

const TOKEN_KEY = 'detectoma_token'
const DB_KEY = 'detectoma_demo_db_v2'

export function getToken() { return localStorage.getItem(TOKEN_KEY) }
export function setToken(t) { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY) }

const delay = (ms = 350) => new Promise(r => setTimeout(r, ms))
const uid = () => Math.random().toString(36).slice(2, 10)
const nowISO = () => new Date().toISOString()
const normEmail = (e) => String(e || '').trim().toLowerCase()

function getDb() {
  const raw = localStorage.getItem(DB_KEY)
  if (raw) { try { return JSON.parse(raw) } catch { /* reset below */ } }
  return { users: {}, profiles: {}, reports: {}, reminders: {}, billing: {} }
}
function saveDb(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)) }
function currentUser(db) {
  const email = getToken()
  if (!email || !db.users[email]) { const e = { detail: 'unauthorized', status: 401 }; throw e }
  return db.users[email]
}
function publicUser(u) {
  const { password, ...rest } = u
  return rest
}

// ---------------------------------------------------------------------------
// CONTENT — 5 tumor markers, 3 risk levels, education, all EN/AR
// ---------------------------------------------------------------------------
const MARKERS = {
  cea:    { unit: 'ng/mL',  reference_low: 0, reference_high: 5.0,  high_threshold: 10.0,
            name: { en: 'CEA (Carcinoembryonic Antigen)', ar: 'المستضد السرطاني المضغي (CEA)' },
            explanations: {
              normal:   { en: 'Your CEA level is within the normal range. This is reassuring.',
                          ar: 'مستوى CEA لديك ضمن النطاق الطبيعي. هذا مطمئن.' },
              elevated: { en: 'Your CEA is mildly above the reference range. This can be caused by smoking, inflammation, or benign conditions — not only cancer. Discuss repeat testing with your doctor.',
                          ar: 'مستوى CEA لديك أعلى قليلاً من النطاق المرجعي. قد يكون ذلك بسبب التدخين أو الالتهاب أو حالات حميدة — وليس السرطان فقط. ناقش إعادة الفحص مع طبيبك.' },
              high:     { en: 'Your CEA is significantly elevated. Please share this result with a doctor promptly for further evaluation.',
                          ar: 'مستوى CEA لديك مرتفع بشكل ملحوظ. يرجى مشاركة هذه النتيجة مع الطبيب في أقرب وقت لمزيد من التقييم.' } } },
  ca125:  { unit: 'U/mL',   reference_low: 0, reference_high: 35.0, high_threshold: 70.0,
            name: { en: 'CA-125', ar: 'CA-125' },
            explanations: {
              normal:   { en: 'Your CA-125 is within the normal range.',
                          ar: 'مستوى CA-125 لديك ضمن النطاق الطبيعي.' },
              elevated: { en: 'CA-125 is mildly elevated. Many benign conditions (menstruation, endometriosis, fibroids) raise it. Your doctor can interpret it in context.',
                          ar: 'مستوى CA-125 مرتفع قليلاً. ترفعه حالات حميدة كثيرة (الدورة الشهرية، بطانة الرحم المهاجرة، الأورام الليفية). يمكن لطبيبك تفسيره في سياقه.' },
              high:     { en: 'CA-125 is notably high. Please consult a doctor for further assessment.',
                          ar: 'مستوى CA-125 مرتفع بشكل ملحوظ. يرجى استشارة الطبيب لمزيد من التقييم.' } } },
  psa:    { unit: 'ng/mL',  reference_low: 0, reference_high: 4.0,  high_threshold: 10.0,
            name: { en: 'PSA (Prostate-Specific Antigen)', ar: 'مستضد البروستاتا النوعي (PSA)' },
            explanations: {
              normal:   { en: 'Your PSA is within the normal range.',
                          ar: 'مستوى PSA لديك ضمن النطاق الطبيعي.' },
              elevated: { en: 'PSA is mildly elevated. Age, recent activity, and benign prostate enlargement can raise it. Discuss follow-up with your doctor.',
                          ar: 'مستوى PSA مرتفع قليلاً. قد يرفعه العمر والنشاط الأخير وتضخم البروستاتا الحميد. ناقش المتابعة مع طبيبك.' },
              high:     { en: 'PSA is significantly elevated. Please see a doctor for further evaluation.',
                          ar: 'مستوى PSA مرتفع بشكل كبير. يرجى مراجعة الطبيب لمزيد من التقييم.' } } },
  afp:    { unit: 'ng/mL',  reference_low: 0, reference_high: 10.0, high_threshold: 20.0,
            name: { en: 'AFP (Alpha-Fetoprotein)', ar: 'البروتين الجنيني ألفا (AFP)' },
            explanations: {
              normal:   { en: 'Your AFP is within the normal range.',
                          ar: 'مستوى AFP لديك ضمن النطاق الطبيعي.' },
              elevated: { en: 'AFP is mildly elevated. Liver conditions and pregnancy can raise it. Your doctor can advise on next steps.',
                          ar: 'مستوى AFP مرتفع قليلاً. قد ترفعه أمراض الكبد والحمل. يمكن لطبيبك إرشادك للخطوات التالية.' },
              high:     { en: 'AFP is notably high. Please consult a doctor promptly.',
                          ar: 'مستوى AFP مرتفع بشكل ملحوظ. يرجى استشارة الطبيب في أقرب وقت.' } } },
  ca19_9: { unit: 'U/mL',   reference_low: 0, reference_high: 37.0, high_threshold: 100.0,
            name: { en: 'CA 19-9', ar: 'CA 19-9' },
            explanations: {
              normal:   { en: 'Your CA 19-9 is within the normal range.',
                          ar: 'مستوى CA 19-9 لديك ضمن النطاق الطبيعي.' },
              elevated: { en: 'CA 19-9 is mildly elevated. Benign digestive conditions can raise it. Discuss with your doctor.',
                          ar: 'مستوى CA 19-9 مرتفع قليلاً. قد ترفعه حالات هضمية حميدة. ناقش ذلك مع طبيبك.' },
              high:     { en: 'CA 19-9 is significantly elevated. Please seek medical evaluation.',
                          ar: 'مستوى CA 19-9 مرتفع بشكل كبير. يرجى طلب التقييم الطبي.' } } },
}
const MARKER_KEYS = Object.keys(MARKERS)

const LEVELS = {
  normal:    { title: { en: 'Normal', ar: 'طبيعي' },
               summary: { en: 'All detected markers are within their normal reference ranges. Continue routine screening as advised by your doctor.',
                          ar: 'جميع العلامات المكتشفة ضمن نطاقاتها المرجعية الطبيعية. تابع الفحص الروتيني حسب نصيحة طبيبك.' } },
  monitor:   { title: { en: 'Monitor', ar: 'مراقبة' },
               summary: { en: 'One or more markers are mildly elevated. This is often benign, but repeat testing or a doctor visit is recommended.',
                          ar: 'واحدة أو أكثر من العلامات مرتفعة قليلاً. غالباً ما يكون ذلك حميداً، لكن يُنصح بإعادة الفحص أو زيارة الطبيب.' } },
  follow_up: { title: { en: 'Follow up', ar: 'متابعة' },
               summary: { en: 'One or more markers are significantly elevated. Please share these results with a doctor promptly.',
                          ar: 'واحدة أو أكثر من العلامات مرتفعة بشكل كبير. يرجى مشاركة هذه النتائج مع الطبيب في أقرب وقت.' } },
}

const ARTICLES = [
  { id: 'what-are-tumor-markers',
    title:   { en: 'What are tumor markers?', ar: 'ما هي علامات الأورام؟' },
    summary: { en: 'Tumor markers are substances measured in blood that can be elevated in some cancers — but also in many benign conditions.',
               ar: 'علامات الأورام هي مواد تُقاس في الدم وقد ترتفع في بعض أنواع السرطان — ولكن أيضاً في العديد من الحالات الحميدة.' },
    body:    { en: 'Tumor markers are proteins or other substances produced by cancer cells or by the body in response to cancer. A single elevated result does not mean you have cancer: levels rise with inflammation, smoking, benign growths, and other everyday conditions. Doctors use markers alongside imaging, biopsy, and your history — never alone. Trends over time matter more than any single value.',
               ar: 'علامات الأورام هي بروتينات أو مواد أخرى تنتجها الخلايا السرطانية أو ينتجها الجسم استجابةً للسرطان. النتيجة المرتفعة الواحدة لا تعني إصابتك بالسرطان: ترتفع المستويات مع الالتهاب والتدخين والأورام الحميدة وحالات يومية أخرى. يستخدم الأطباء العلامات إلى جانب التصوير والخزعة وتاريخك المرضي — وليس بمفردها أبداً. الاتجاهات عبر الوقت أهم من أي قيمة مفردة.' } },
  { id: 'reading-your-results',
    title:   { en: 'How to read your results', ar: 'كيف تقرأ نتائجك' },
    summary: { en: 'Reference ranges tell you what is typical. Being slightly outside a range is common and often harmless.',
               ar: 'النطاقات المرجعية تخبرك بما هو معتاد. الخروج قليلاً عن النطاق أمر شائع وغالباً غير ضار.' },
    body:    { en: 'Every marker has a reference range — the values seen in most healthy people. Results just outside the range are flagged, but context decides what they mean. Ask your doctor: Is this a new change or stable? Should it be repeated? What else could explain it? Bring prior results so trends can be compared.',
               ar: 'لكل علامة نطاق مرجعي — القيم الموجودة لدى معظم الأصحاء. تُوسم النتائج خارج النطاق قليلاً، لكن السياق يحدد معناها. اسأل طبيبك: هل هذا تغير جديد أم مستقر؟ هل ينبغي إعادته؟ ما الذي قد يفسره أيضاً؟ أحضر نتائجك السابقة لمقارنة الاتجاهات.' } },
  { id: 'screening-and-prevention',
    title:   { en: 'Screening and prevention', ar: 'الفحص والوقاية' },
    summary: { en: 'Regular screening finds problems early. Lifestyle choices meaningfully lower risk for many cancers.',
               ar: 'الفحص المنتظم يكتشف المشكلات مبكراً. خيارات نمط الحياة تقلل بشكل ملحوظ من خطر الإصابة بالعديد من أنواع السرطان.' },
    body:    { en: 'Early detection saves lives. Follow the screening schedule your doctor recommends for your age and risk factors. Not smoking, staying active, eating well, limiting alcohol, and keeping vaccinations current all reduce risk. This app helps you keep and understand your records — it does not replace professional screening.',
               ar: 'الكشف المبكر ينقذ الأرواح. اتبع جدول الفحص الذي يوصي به طبيبك حسب عمرك وعوامل الخطر لديك. عدم التدخين والنشاط البدني والتغذية الجيدة والحد من الكحول وتحديث اللقاحات كلها تقلل الخطر. يساعدك هذا التطبيق على حفظ سجلاتك وفهمها — ولا يحل محل الفحص المهني.' } },
]

// ---------------------------------------------------------------------------
// RISK ENGINE  (ported from backend risk_engine.py)
// ---------------------------------------------------------------------------
const STATUS_WEIGHT = { normal: 0.0, elevated: 0.5, high: 1.0 }
function statusFor(key, value) {
  const m = MARKERS[key]
  if (!m || value == null) return 'normal'
  if (value >= m.high_threshold) return 'high'
  if (value > m.reference_high) return 'elevated'
  return 'normal'
}
function riskResult(markers) {
  const flagged = markers.map((mk) => {
    const m = MARKERS[mk.marker_key] || {}
    const status = statusFor(mk.marker_key, mk.value)
    return { marker_key: mk.marker_key, value: mk.value, unit: mk.unit || m.unit,
             reference_low: m.reference_low ?? 0, reference_high: m.reference_high, status }
  })
  const worst = flagged.reduce((w, f) => Math.max(w, STATUS_WEIGHT[f.status] ?? 0), 0)
  const level = worst >= 1.0 ? 'follow_up' : worst >= 0.5 ? 'monitor' : 'normal'
  return { level, score: worst, flagged }
}

// ---------------------------------------------------------------------------
// MOCK OCR  (deterministic from filename — ported from mock_provider.py)
// ---------------------------------------------------------------------------
function seedFrom(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (h * 31 + str.charCodeAt(i)) >>> 0 }
  return h
}
function mockExtract(filename) {
  const seed = seedFrom(filename || 'report')
  return MARKER_KEYS.map((key, i) => {
    const m = MARKERS[key]
    const bucket = (seed >> (i * 3)) % 10
    let value
    if (bucket < 6) value = Math.round((m.reference_low + (m.reference_high - m.reference_low) * ((bucket + 1) / 10)) * 10) / 10
    else if (bucket < 9) value = Math.round(m.reference_high * (1.1 + 0.3 * (bucket - 6)) * 10) / 10
    else value = Math.round(m.high_threshold * 1.2 * 10) / 10
    return { marker_key: key, value, unit: m.unit, confidence: Math.round((0.78 + (bucket % 4) * 0.05) * 100) / 100 }
  })
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------
export const api = {
  // ---- Auth ----
  signup: async (b) => {
    await delay()
    const db = getDb()
    const email = normEmail(b.email)
    if (db.users[email]) { const e = { detail: 'email_taken', status: 409 }; throw e }
    const id = uid()
    const user = {
      id, email, full_name: b.full_name, password: b.password,
      language: b.language || 'en', role: b.role || 'patient',
      phone: b.phone || null, country: b.country || null, date_of_birth: b.date_of_birth || null,
      plan: 'free', onboarding_complete: false, created_at: nowISO(),
    }
    db.users[email] = user
    db.profiles[id] = { age: null, sex: null, family_history: [], risk_factors: [] }
    db.billing[id] = { plan: 'free', plan_status: 'active', trial_days_left: 0 }
    saveDb(db)
    setToken(email)
    return { access_token: email, user: publicUser(user) }
  },
  signin: async (b) => {
    await delay()
    const db = getDb()
    const email = normEmail(b.email)
    const u = db.users[email]
    if (!u || u.password !== b.password) { const e = { detail: 'invalid_credentials', status: 401 }; throw e }
    setToken(email)
    return { access_token: email, user: publicUser(u) }
  },
  me: async () => { await delay(80); return publicUser(currentUser(getDb())) },
  requestReset: async () => { await delay(); return { detail: 'sent', dev_code: '123456' } },
  confirmReset: async (b) => {
    await delay(); const db = getDb(); const email = normEmail(b.email)
    if (db.users[email]) { db.users[email].password = b.new_password; saveDb(db) }
    return { detail: 'updated' }
  },

  // ---- Account ----
  getProfile: async () => { const db = getDb(); return db.profiles[currentUser(db).id] },
  updateProfile: async (b) => {
    await delay(); const db = getDb(); const u = currentUser(db)
    db.profiles[u.id] = { ...db.profiles[u.id], ...b }
    u.onboarding_complete = true; saveDb(db)
    return db.profiles[u.id]
  },
  updateSettings: async (b) => {
    await delay(); const db = getDb(); const u = currentUser(db)
    Object.assign(u, b); saveDb(db); return publicUser(u)
  },
  skipOnboarding: async () => {
    await delay(); const db = getDb(); const u = currentUser(db)
    u.onboarding_complete = true; saveDb(db); return publicUser(u)
  },
  exportData: async () => {
    const db = getDb(); const u = currentUser(db)
    return { user: publicUser(u), profile: db.profiles[u.id],
             reports: Object.values(db.reports).filter(r => r.user_id === u.id) }
  },
  deleteAccount: async () => {
    await delay(); const db = getDb(); const u = currentUser(db)
    delete db.users[u.email]; delete db.profiles[u.id]; delete db.billing[u.id]
    Object.values(db.reports).forEach(r => { if (r.user_id === u.id) delete db.reports[r.id] })
    saveDb(db); setToken(null)
  },

  // ---- Reports ----
  uploadReport: async (formData) => {
    await delay(900)
    const db = getDb(); const u = currentUser(db); const id = uid()
    const file = formData.get('file')
    const filename = (file && file.name) || 'report.pdf'
    db.reports[id] = {
      id, user_id: u.id, report_type: formData.get('report_type') || 'tumor_markers',
      filename, status: 'uploaded', created_at: nowISO(),
      markers: [], risk_result: null, _seedName: filename + '|' + id,
    }
    saveDb(db); return db.reports[id]
  },
  extractReport: async (id) => {
    await delay(700); const db = getDb(); const r = db.reports[id]
    r.markers = mockExtract(r._seedName || r.filename)
    r.status = 'extracted'; saveDb(db); return r
  },
  reviewReport: async (id, b) => {
    await delay(); const db = getDb(); const r = db.reports[id]
    r.markers = b.markers.map(m => ({ ...m, unit: m.unit || MARKERS[m.marker_key]?.unit,
      confidence: (r.markers.find(x => x.marker_key === m.marker_key) || {}).confidence }))
    r.status = 'reviewed'; saveDb(db); return r
  },
  analyzeReport: async (id) => {
    await delay(1200); const db = getDb(); const r = db.reports[id]
    r.risk_result = riskResult(r.markers)
    r.status = 'analyzed'; saveDb(db); return r
  },
  listReports: async () => {
    await delay(); const db = getDb(); const u = currentUser(db)
    return Object.values(db.reports).filter(r => r.user_id === u.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  },
  getReport: async (id) => { await delay(120); return getDb().reports[id] },
  deleteReport: async (id) => { await delay(); const db = getDb(); delete db.reports[id]; saveDb(db) },

  // trends → ARRAY of series: [{ marker_key, points:[{date,value}] }]
  trends: async () => {
    await delay(); const db = getDb(); const u = currentUser(db)
    const analyzed = Object.values(db.reports)
      .filter(r => r.user_id === u.id && r.status === 'analyzed')
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
    const byMarker = {}
    analyzed.forEach(r => (r.markers || []).forEach(m => {
      if (m.value == null) return
      ;(byMarker[m.marker_key] ||= []).push({ date: r.created_at, value: m.value })
    }))
    return MARKER_KEYS.filter(k => byMarker[k]).map(k => ({ marker_key: k, points: byMarker[k] }))
  },

  // ---- Reminders ----
  listReminders: async () => {
    await delay(); const db = getDb(); const u = currentUser(db)
    return Object.values(db.reminders).filter(x => x.user_id === u.id)
  },
  createReminder: async (b) => {
    await delay(); const db = getDb(); const u = currentUser(db)
    const id = uid(); db.reminders[id] = { id, user_id: u.id, ...b }; saveDb(db); return db.reminders[id]
  },
  deleteReminder: async (id) => { await delay(); const db = getDb(); delete db.reminders[id]; saveDb(db) },

  // ---- Billing ----
  billingStatus: async () => { const db = getDb(); return db.billing[currentUser(db).id] || { plan: 'free', plan_status: 'active' } },
  subscribe: async () => {
    await delay(); const db = getDb(); const u = currentUser(db)
    u.plan = 'premium'; db.billing[u.id] = { plan: 'premium', plan_status: 'trialing', trial_days_left: 14 }
    saveDb(db); return publicUser(u)
  },
  cancelPlan: async () => {
    await delay(); const db = getDb(); const u = currentUser(db)
    u.plan = 'free'; db.billing[u.id] = { plan: 'free', plan_status: 'active', trial_days_left: 0 }
    saveDb(db); return publicUser(u)
  },

  // ---- Chat (keyword bilingual) ----
  chat: async (messages) => {
    await delay(700)
    const last = (Array.isArray(messages) ? messages[messages.length - 1]?.content : messages) || ''
    const isAr = /[\u0600-\u06FF]/.test(last)
    const q = last.toLowerCase()
    let reply
    if (/cea|ca-?125|psa|afp|ca ?19|marker|علامة|علامات/.test(q))
      reply = isAr ? 'علامات الأورام مواد تُقاس في الدم. ارتفاعها لا يعني السرطان بالضرورة — ناقش نتائجك مع طبيبك.' : 'Tumor markers are substances measured in blood. An elevated value does not necessarily mean cancer — discuss your results with a doctor.'
    else if (/upload|report|رفع|تقرير/.test(q))
      reply = isAr ? 'اذهب إلى صفحة "رفع" واختر صورة أو ملف PDF لتقريرك، وسيقوم التطبيق بمحاكاة استخراج القيم.' : 'Go to the Upload page and pick an image or PDF of your report — the app will simulate extracting the values.'
    else if (/hi|hello|hey|مرحبا|السلام|أهلا/.test(q))
      reply = isAr ? 'مرحباً! أنا مساعد DETECTA التجريبي. اسألني عن علامات الأورام أو كيفية استخدام التطبيق.' : 'Hi! I am the DETECTA demo assistant. Ask me about tumor markers or how to use the app.'
    else
      reply = isAr ? 'أنا مساعد تجريبي في DETECTA. يمكنني الشرح عن علامات الأورام وكيفية قراءة نتائجك. هذه ليست نصيحة طبية.' : 'I am the DETECTA demo assistant. I can explain tumor markers and how to read your results. This is not medical advice.'
    return { reply }
  },

  // ---- Content ----
  markers: async (lang = 'en') => {
    const l = String(lang).startsWith('ar') ? 'ar' : 'en'
    return { markers: MARKER_KEYS.map(k => {
      const m = MARKERS[k]
      return { marker_key: k, name: m.name[l], unit: m.unit,
        reference_low: m.reference_low, reference_high: m.reference_high,
        explanations: { normal: m.explanations.normal[l], elevated: m.explanations.elevated[l], high: m.explanations.high[l] } }
    }) }
  },
  resultsContent: async (lang = 'en') => {
    const l = String(lang).startsWith('ar') ? 'ar' : 'en'
    const levels = {}
    Object.keys(LEVELS).forEach(k => { levels[k] = { title: LEVELS[k].title[l], summary: LEVELS[k].summary[l] } })
    return { levels }
  },
  education: async (lang = 'en') => {
    const l = String(lang).startsWith('ar') ? 'ar' : 'en'
    return { articles: ARTICLES.map(a => ({ id: a.id, title: a.title[l], summary: a.summary[l], body: a.body[l] })) }
  },
}
