# DETECTA

**Live site · الموقع المباشر:** **https://hellobrther2423-bot.github.io/detecta/**

Open the link, choose your language, sign up, and try it. No installation, no account approval — it works entirely in your browser.

افتح الرابط، اختر لغتك، أنشئ حساباً، وجرّب التطبيق. بدون تثبيت وبدون موافقة — يعمل بالكامل داخل متصفحك.

---

## English

DETECTA is a bilingual (English / العربية) lab-report screening aid. You upload a photo or PDF of a lab report, DETECTA reads the tumor-marker values, compares them against normal reference ranges, and shows a plain-language **screening risk indicator** in your language, with charts and a history of your results over time.

> ⚠️ **DETECTA is a screening aid, not a medical diagnosis.** It cannot confirm or rule out cancer or any disease. Only a qualified doctor can interpret a lab report. Always follow up with a healthcare professional.

### This is a demo

This version runs **100% in your browser**. There is no server and no central database:

- Anyone can open the link, sign up, and use every feature.
- Your account and reports are saved **only in your own browser** (via `localStorage`).
- Nothing you enter is sent anywhere or stored on any server.
- Because there's no backend, the value extraction (OCR) and the AI assistant replies are **simulated** for demonstration.

### Features

- Bilingual English / Arabic with full right-to-left (RTL) support
- Sign up / sign in / password reset, with a patient or doctor role
- Upload a report → simulated extraction → review the values → risk result
- Dashboard with charts, trends over time, and a history of reports
- Built-in assistant that answers questions about tumor markers
- Light and dark themes

### Run it locally (optional)

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173

### Publish your own copy

```bash
cd frontend
npm run deploy
```

This builds the app and publishes it to the `gh-pages` branch. In your repo on GitHub, go to **Settings → Pages** and set the source branch to **`gh-pages`**.

---

## العربية

DETECTA أداة مساعدة للفحص المبكر تدعم لغتين (الإنجليزية / العربية). ترفع صورة أو ملف PDF لتقرير مختبر، فيقرأ DETECTA قيم علامات الأورام، ويقارنها بالنطاقات المرجعية الطبيعية، ثم يعرض **مؤشر خطر للفحص** بلغة مبسّطة بلغتك، مع رسوم بيانية وسجل لنتائجك عبر الوقت.

> ⚠️ **DETECTA أداة مساعدة للفحص وليست تشخيصاً طبياً.** لا يمكنها تأكيد أو استبعاد السرطان أو أي مرض. الطبيب المختص وحده من يستطيع تفسير تقرير المختبر. راجع دائماً مختصاً في الرعاية الصحية.

### هذه نسخة تجريبية

تعمل هذه النسخة **بنسبة 100% داخل متصفحك**. لا يوجد خادم ولا قاعدة بيانات مركزية:

- يمكن لأي شخص فتح الرابط وإنشاء حساب واستخدام جميع الميزات.
- يُحفظ حسابك وتقاريرك **داخل متصفحك أنت فقط** (عبر `localStorage`).
- لا يُرسَل أي شيء تُدخله إلى أي مكان ولا يُخزَّن على أي خادم.
- بما أنه لا يوجد خادم، فإن استخراج القيم (OCR) وردود المساعد الذكي **محاكاة** لأغراض العرض.

### الميزات

- لغتان: الإنجليزية والعربية مع دعم كامل للكتابة من اليمين إلى اليسار
- إنشاء حساب / تسجيل دخول / إعادة تعيين كلمة المرور، مع اختيار دور مريض أو طبيب
- رفع تقرير ← استخراج محاكى ← مراجعة القيم ← نتيجة الخطر
- لوحة تحكم فيها رسوم بيانية واتجاهات عبر الوقت وسجل للتقارير
- مساعد مدمج يجيب عن الأسئلة حول علامات الأورام
- وضع فاتح ووضع داكن

### تشغيله محلياً (اختياري)

```bash
cd frontend
npm install
npm run dev
```

ثم افتح http://localhost:5173

### نشر نسختك الخاصة

```bash
cd frontend
npm run deploy
```

يبني هذا الأمر التطبيق وينشره على فرع `gh-pages`. من صفحة المستودع على GitHub، اذهب إلى **Settings → Pages** واضبط مصدر النشر على فرع **`gh-pages`**.

---

Built with React + Vite + i18next.
