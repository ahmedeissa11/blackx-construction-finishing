import type { Locale } from "@/lib/i18n";

const ar = {
  brand: {
    name: "BLACK X",
    sub: "CONSTRUCTION & FINISHING",
    full: "بلاك إكس للإنشاءات والتشطيبات",
  },
  meta: {
    siteDescription:
      "بلاك إكس للإنشاءات والتشطيبات — حلول متكاملة للإنشاءات والتشطيبات الداخلية والخارجية للمنازل والفلل، بجودة عالية واهتمام بكل التفاصيل.",
  },
  nav: {
    home: "الرئيسية",
    about: "من نحن",
    services: "خدماتنا",
    projects: "مشاريعنا",
    articles: "المقالات",
    contact: "تواصل معنا",
    faqs: "الأسئلة الشائعة",
    requestCta: "طلب معاينة",
    menu: "القائمة",
    close: "إغلاق",
    dashboard: "لوحة التشغيل",
    portal: "بوابة العميل",
  },
  common: {
    home: "الرئيسية",
    learnMore: "اعرف المزيد",
    viewDetails: "عرض التفاصيل",
    viewAllServices: "كل الخدمات",
    viewAllProjects: "كل المشاريع",
    requestInspection: "طلب معاينة مجانية",
    browseServices: "استعرض خدماتنا",
    backToHome: "العودة للرئيسية",
    back: "رجوع",
    illustrativeNote: "صور توضيحية لتوجهنا في الخامات والتشطيب، وليست صورًا لمشاريع منجزة.",
    previewContent: "محتوى توضيحي للمعاينة",
    readMore: "اقرأ المقال",
    minRead: "دقائق قراءة",
    relatedServices: "خدمات ذات صلة",
    relatedArticles: "مقالات ذات صلة",
    scopeNote:
      "نطاق العمل النهائي والبنود المشمولة تُحدَّد بعد المعاينة وتُوثَّق كتابيًا قبل بدء التنفيذ.",
  },
  home: {
    eyebrow: "بلاك إكس للمقاولات والتشطيبات",
    titleA: "نبني مساحات",
    titleB: "تعيش فيها أكثر",
    lead: "من الإنشاءات المتكاملة إلى التشطيبات الداخلية والخارجية، نقدّم حلولًا عملية وجودة تنفيذ في كل مرحلة — من أول معاينة حتى التسليم.",
    trust: [
      { title: "فهم احتياجك أولًا", text: "جلسة معاينة ومناقشة تفصيلية قبل أي التزام." },
      { title: "مقترح واضح ومكتوب", text: "نطاق عمل وبنود محددة قبل بدء التنفيذ." },
      { title: "تنفيذ بإشراف متخصص", text: "إدارة دقيقة وجودة في كل مرحلة من مراحل العمل." },
      { title: "متابعة حتى التسليم", text: "مراجعة شاملة وتسليم موثّق خطوة بخطوة." },
    ],
    servicesEyebrow: "خدماتنا",
    servicesTitle: "حلول متكاملة للإنشاءات والتشطيبات",
    servicesLead:
      "نقدّم مجموعة متكاملة من خدمات الإنشاءات والتشطيبات الداخلية والخارجية، باستخدام خامات مختارة بعناية وفريق عمل متخصص.",
    craftEyebrow: "نهج عملنا",
    craftTitle: "تفاصيل تصنع الفرق",
    craftText:
      "نؤمن أن جودة التنفيذ تبدأ من التخطيط الجيد، وأن الالتزام في كل مرحلة — والاهتمام بأدق التفاصيل — هو الطريق لنتيجة تدوم.",
    craftPoints: [
      "خامات عالية الجودة من مصادر موثوقة",
      "إشراف هندسي على مراحل التنفيذ",
      "مراجعة جودة قبل التسليم النهائي",
    ],
    materialsTitle: "مواد مختارة.. جودة تدوم",
    materialsText:
      "نستخدم خامات مختارة بعناية من علامات موثوقة، لنضمن نتيجة عملية ومظهرًا راقيًا يدوم مع الاستخدام اليومي.",
    processEyebrow: "منهجيتنا",
    processTitle: "من الفكرة إلى الواقع",
    processLead:
      "نؤمن أن نجاح أي مشروع يبدأ بفهم احتياجاتك، وينتهي بتسليم مساحة تعكس جودة العمل الذي تطمح إليها.",
    steps: [
      { title: "فهم المتطلبات", text: "جلسة استشارة ومعاينة للموقع لفهم طبيعة العمل المطلوب." },
      { title: "إعداد المقترح", text: "تصميم وتحديد الخيارات المناسبة ونطاق العمل بوضوح." },
      { title: "التنفيذ", text: "تنفيذ بإشراف فريق متخصص ومتابعة لمراحل العمل." },
      { title: "التسليم والمتابعة", text: "مراجعة شاملة عند التسليم ومتابعة ما بعد التسليم." },
    ],
    projectsEyebrow: "مشاريعنا",
    projectsTitle: "أعمال تعكس جودة التنفيذ",
    projectsLead: "أعمال مختارة تعكس التزامنا بالجودة والاهتمام بالتفاصيل في كل مشروع.",
    faqEyebrow: "الأسئلة الشائعة",
    faqTitle: "عندك سؤال قبل ما نبدأ؟",
    faqLead: "إجابات مختصرة عن طريقة عملنا وكيفية طلب المعاينة وعرض السعر.",
    ctaTitle: "جاهز تبدأ مشروعك؟",
    ctaText: "اطلب معاينة لموقعك، وهنناقش معاك الاحتياجات والخيارات المناسبة قبل أي خطوة تنفيذ.",
  },
  about: {
    title: "من نحن",
    lead: "شركة متخصصة في الإنشاءات والتشطيبات، نبني مساحات تُعاش — بجودة تنفيذ ووضوح في كل خطوة.",
    introTitle: "نبني على أساس من الثقة والجودة",
    intro: [
      "بلاك إكس للإنشاءات والتشطيبات تقدّم حلولًا متكاملة في مجالات البناء والتشطيب للمنازل والفلل، مع تركيز واضح على جودة التنفيذ والالتزام بنطاق عمل متفق عليه من البداية.",
      "نعمل بمنهجية عملية: نفهم احتياجك أولًا، ثم نقدّم مقترحًا واضحًا بالخيارات والبنود، وننفّذ بإشراف متخصص حتى التسليم — دون وعود عامة أو مفاجآت في منتصف الطريق.",
    ],
    valuesTitle: "مبادئ تحكم شغلنا",
    values: [
      {
        title: "الوضوح قبل التنفيذ",
        text: "نطاق العمل والبنود والخامات تُحدَّد وتُوثَّق قبل بدء أي مرحلة.",
      },
      {
        title: "جودة قابلة للمراجعة",
        text: "مراحل عمل واضحة ومراجعة جودة في نقاط محددة، وليست انطباعًا في النهاية فقط.",
      },
      {
        title: "احترام المساحة وأصحابها",
        text: "تنظيم للموقع والتزام بمواعيد العمل المتفق عليها قدر الإمكان، مع إبلاغك بأي مستجدات.",
      },
    ],
    qualityTitle: "إزاي بنهتم بالجودة؟",
    qualityText:
      "الجودة عندنا ليست كلمة تسويقية، بل خطوات عملية: خامات مختارة من مصادر موثوقة، تنفيذ على مراحل مُراجعة، وتشطيب نهائي يُسلَّم بعد مراجعة مشتركة للتفاصيل.",
    qualityPoints: [
      "اختيار الخامات بما يناسب الاستخدام الفعلي للمساحة",
      "إشراف على التنفيذ ومراجعة كل مرحلة قبل الانتقال لما بعدها",
      "مراجعة تسليم موثّقة ومعالجة أي ملاحظات متفق عليها",
    ],
    workflowTitle: "رحلة العميل معانا",
  },
  services: {
    title: "خدماتنا",
    lead: "حلول متكاملة للإنشاءات والتشطيبات تلبّي احتياجاتك بمستوى عالٍ من الجودة والدقة في التنفيذ.",
    detailIntro: "نبذة عن الخدمة",
    scopeTitle: "نطاق العمل",
    includesTitle: "يشمل عادةً",
    excludesTitle: "خارج النطاق ما لم يُتفق عليه",
    processTitle: "خطوات التنفيذ",
    galleryTitle: "صور توضيحية للخامات والتشطيب",
    faqTitle: "أسئلة شائعة عن الخدمة",
    sideTitle: "مهتم بالخدمة دي؟",
    sideText:
      "اطلب معاينة لموقعك لمناقشة الاحتياجات الفعلية وتحديد نطاق العمل المناسب قبل أي التزام.",
  },
  projects: {
    title: "مشاريعنا",
    lead: "أعمال مختارة تعكس جودة التنفيذ والاهتمام بالتفاصيل.",
    emptyTitle: "سيتم عرض المشاريع المعتمدة هنا",
    emptyText:
      "نعمل حاليًا على إضافة مشاريع معتمدة للعرض بعد اكتمال التوثيق والبيانات التفصيلية لكل مشروع. لا نعرض صورًا توضيحية باعتبارها أعمالًا منجزة.",
    emptyCta: "اطلب معاينة لمشروعك",
    scopeTitle: "نطاق العمل المنفذ",
    galleryTitle: "معرض المشروع",
    metaTitle: "بيانات المشروع",
  },
  request: {
    title: "طلب معاينة / عرض سعر",
    lead: "املأ النموذج وسيتواصل معك فريقنا لترتيب موعد معاينة ومناقشة التفاصيل.",
    formTitle: "أرسل طلبك",
    formLead: "كل ما كانت التفاصيل أوضح، كانت المعاينة والمقترح أدق.",
    stepsTitle: "إيه اللي هيحصل بعد إرسال الطلب؟",
    steps: [
      { title: "مراجعة الطلب", text: "بنراجع البيانات ونجهّز أسئلة المعاينة الأساسية." },
      { title: "تواصل لترتيب موعد", text: "هنتواصل معاك للاتفاق على موعد مناسب للمعاينة." },
      {
        title: "معاينة ومقترح مكتوب",
        text: "بعد المعاينة بيتم إعداد مقترح بنطاق العمل والخيارات المناسبة.",
      },
    ],
    fields: {
      fullName: "الاسم بالكامل",
      phone: "رقم الهاتف",
      email: "البريد الإلكتروني (اختياري)",
      service: "نوع الخدمة المطلوبة",
      servicePlaceholder: "اختر الخدمة",
      city: "المدينة / المنطقة",
      area: "المساحة التقريبية (م²) — اختياري",
      unitType: "نوع الوحدة",
      unitPlaceholder: "اختر نوع الوحدة",
      description: "تفاصيل المشروع",
      descriptionHint: "اكتب نبذة عن حالة الوحدة الحالية واللي حابب تنفذه — ٢٠ حرفًا على الأقل.",
      consent:
        "أوافق على تواصل شركة بلاك إكس معي بخصوص هذا الطلب، وأقر بأن البيانات المدخلة صحيحة.",
      submit: "إرسال الطلب",
      submitting: "جارٍ الإرسال...",
      reset: "إرسال طلب جديد",
    },
    unitTypes: ["شقة سكنية", "فيلا", "دوبلكس", "مكتب / إداري", "تجاري", "أخرى"],
    successTitle: "اكتمل تجهيز الطلب داخل المعاينة فقط",
    successText:
      "اكتملت خطوة الإرسال محليًا داخل واجهة العرض التجريبي فقط؛ لم تُرسل البيانات إلى فريق بلاك إكس ولم تُحفظ في أي نظام. سيبدأ الإرسال الفعلي بعد ربط نظام خلفي معتمد.",
    referenceLabel: "الرقم المرجعي للمعاينة",
    errorTitle: "تعذّر إتمام الإرسال",
    errorText: "حدثت مشكلة أثناء تجهيز الطلب. راجع البيانات وحاول مرة تانية.",
    previewNote:
      "تنبيه: هذه نسخة واجهة للعرض والتطوير — الإرسال هنا تجريبي ولا يُحفَظ في نظام الشركة بعد.",
  },
  contact: {
    title: "تواصل معنا",
    lead: "نرحب باستفسارك، وسنساعدك في بدء مشروعك بخطوة واضحة.",
    infoTitle: "معلومات عامة",
    infoCards: [
      {
        title: "طلبات المعاينة",
        text: "أسرع طريقة لبدء أي مشروع هي ملء نموذج طلب المعاينة، وسيتم ترتيب التواصل حول الموعد المناسب.",
      },
      {
        title: "الاستفسارات العامة",
        text: "لو عندك سؤال عام عن خدماتنا أو طريقة عملنا، استخدم نموذج التواصل وسيتم الرد في حدود قنوات التواصل المتاحة عند الإطلاق.",
      },
      {
        title: "متابعة المشاريع",
        text: "عملاء المشاريع الجارية يمكنهم متابعة المراحل والتقارير من خلال بوابة العميل بعد تفعيل حساباتهم من إدارة الشركة.",
      },
    ],
    formTitle: "أرسل لنا رسالة",
    fields: {
      fullName: "الاسم بالكامل",
      phone: "رقم الهاتف",
      subject: "الموضوع",
      subjectPlaceholder: "اختر الموضوع",
      message: "رسالتك",
      consent: "أوافق على التواصل معي بخصوص هذه الرسالة.",
      submit: "إرسال الرسالة",
      submitting: "جارٍ الإرسال...",
    },
    subjects: ["استفسار عن خدمة", "طلب معاينة", "متابعة مشروع قائم", "أخرى"],
    successTitle: "اكتمل تجهيز الرسالة داخل المعاينة فقط",
    successText:
      "اكتمل تجهيز الرسالة محليًا داخل واجهة العرض التجريبي فقط؛ لم تُرسل ولم تُحفظ في أي نظام. سيبدأ الإرسال الفعلي بعد ربط قنوات التواصل الرسمية للشركة.",
    verifiedNote:
      "لا نعرض أرقام هواتف أو عناوين بريدية هنا قبل اعتمادها رسميًا من إدارة الشركة، حتى لا تصل رسائلك لقنوات غير صحيحة.",
  },
  articles: {
    title: "المقالات",
    lead: "محتوى عملي يساعدك تفهم مراحل التشطيب وتختار صح قبل ما تبدأ.",
    emptyTitle: "لا توجد مقالات منشورة حاليًا",
    emptyText: "سيتم نشر المقالات المعتمدة من فريق بلاك إكس هنا تباعًا.",
  },
  faqsPage: {
    title: "الأسئلة الشائعة",
    lead: "إجابات واضحة عن طلب المعاينة، إعداد المقترح، ومراحل التنفيذ والتسليم.",
  },
  validation: {
    required: "الحقل ده مطلوب",
    nameShort: "من فضلك اكتب الاسم بالكامل",
    phoneInvalid: "رقم الهاتف غير صحيح — اكتبه بأرقام صحيحة",
    emailInvalid: "صيغة البريد الإلكتروني غير صحيحة",
    areaInvalid: "المساحة يجب أن تكون رقمًا أكبر من صفر",
    descriptionShort: "اكتب تفاصيل أكثر قليلًا (٢٠ حرفًا على الأقل) عشان نقدر نساعدك بدقة",
    messageShort: "الرسالة قصيرة جدًا — اكتب تفاصيل أكثر قليلًا",
    consentRequired: "يلزم الموافقة على التواصل قبل الإرسال",
  },
  footer: {
    tagline:
      "حلول متكاملة في الإنشاءات والتشطيبات للمنازل والفلل — بوضوح في النطاق، وجودة في التنفيذ، ومتابعة حتى التسليم.",
    exploreTitle: "تصفح الموقع",
    servicesTitle: "خدماتنا",
    companyTitle: "الشركة",
    rights: "© بلاك إكس للإنشاءات والتشطيبات. جميع الحقوق محفوظة.",
    frontendNote: "نسخة واجهة للمراجعة — البيانات التجريبية موضّحة داخل أقسام التشغيل والبوابة.",
  },
  states: {
    notFoundTitle: "الصفحة مش موجودة",
    notFoundText: "الرابط اللي فتحته غير متاح أو تم نقله. ارجع للصفحة الرئيسية وكمل من هناك.",
    errorTitle: "حصل خطأ غير متوقع",
    errorText: "جرّب تحديث الصفحة. لو المشكلة استمرت، تواصل معنا من صفحة التواصل.",
    retry: "حاول مرة تانية",
    loading: "جارٍ التحميل...",
  },
};

export type Dictionary = typeof ar;

const en: Dictionary = {
  brand: {
    name: "BLACK X",
    sub: "CONSTRUCTION & FINISHING",
    full: "Black X Construction & Finishing",
  },
  meta: {
    siteDescription:
      "Black X Construction & Finishing — integrated construction and interior/exterior finishing for homes and villas, with high execution quality and attention to every detail.",
  },
  nav: {
    home: "Home",
    about: "About Us",
    services: "Services",
    projects: "Projects",
    articles: "Articles",
    contact: "Contact",
    faqs: "FAQs",
    requestCta: "Request Inspection",
    menu: "Menu",
    close: "Close",
    dashboard: "Operations Dashboard",
    portal: "Client Portal",
  },
  common: {
    home: "Home",
    learnMore: "Learn more",
    viewDetails: "View details",
    viewAllServices: "All services",
    viewAllProjects: "All projects",
    requestInspection: "Request a Free Inspection",
    browseServices: "Browse Our Services",
    backToHome: "Back to home",
    back: "Back",
    illustrativeNote:
      "Illustrative imagery showing our materials and finishing direction — not photos of completed projects.",
    previewContent: "Illustrative preview content",
    readMore: "Read article",
    minRead: "min read",
    relatedServices: "Related services",
    relatedArticles: "Related articles",
    scopeNote:
      "The final scope and included items are defined after the site inspection and documented in writing before execution starts.",
  },
  home: {
    eyebrow: "Black X Contracting & Finishing",
    titleA: "We Build Spaces",
    titleB: "You Live More In",
    lead: "From full construction to interior and exterior finishing, we deliver practical solutions and execution quality at every stage — from the first inspection to handover.",
    trust: [
      {
        title: "We understand first",
        text: "A detailed inspection and discussion before any commitment.",
      },
      {
        title: "A clear written proposal",
        text: "Defined scope and line items before execution begins.",
      },
      {
        title: "Supervised execution",
        text: "Precise management and quality at every work stage.",
      },
      {
        title: "Follow-up to handover",
        text: "A full review and documented handover, step by step.",
      },
    ],
    servicesEyebrow: "Our Services",
    servicesTitle: "Integrated Construction & Finishing Solutions",
    servicesLead:
      "A complete range of construction and interior/exterior finishing services, using carefully selected materials and a specialised team.",
    craftEyebrow: "Our Approach",
    craftTitle: "Details Make The Difference",
    craftText:
      "We believe execution quality starts with good planning, and that commitment at every stage — with attention to the smallest details — is how results last.",
    craftPoints: [
      "High-quality materials from trusted sources",
      "Engineering supervision across execution stages",
      "Quality review before final handover",
    ],
    materialsTitle: "Selected Materials. Lasting Quality.",
    materialsText:
      "We use carefully selected materials from trusted brands, for a practical result and an elegant look that stands up to daily use.",
    processEyebrow: "Our Method",
    processTitle: "From Idea To Reality",
    processLead:
      "We believe every successful project starts with understanding your needs, and ends with a space that reflects the quality you aim for.",
    steps: [
      {
        title: "Understand requirements",
        text: "A consultation and site inspection to understand the work needed.",
      },
      {
        title: "Prepare the proposal",
        text: "Design direction, suitable options and a clearly defined scope.",
      },
      {
        title: "Execution",
        text: "Execution supervised by a specialised team with stage-by-stage follow-up.",
      },
      {
        title: "Handover & follow-up",
        text: "A full handover review and follow-up after delivery.",
      },
    ],
    projectsEyebrow: "Our Projects",
    projectsTitle: "Work That Reflects Execution Quality",
    projectsLead: "Selected work reflecting our commitment to quality and detail in every project.",
    faqEyebrow: "FAQs",
    faqTitle: "Questions before we start?",
    faqLead: "Short answers about how we work and how to request an inspection and quotation.",
    ctaTitle: "Ready to start your project?",
    ctaText:
      "Request a site inspection and we will discuss your needs and the right options before any execution step.",
  },
  about: {
    title: "About Us",
    lead: "A construction and finishing company building spaces made for living — with execution quality and clarity at every step.",
    introTitle: "Built On Trust And Quality",
    intro: [
      "Black X Construction & Finishing provides integrated building and finishing solutions for homes and villas, with a clear focus on execution quality and a scope agreed from the start.",
      "We work practically: understand your needs first, present a clear proposal with options and line items, then execute under specialised supervision until handover — without vague promises or mid-way surprises.",
    ],
    valuesTitle: "Principles That Govern Our Work",
    values: [
      {
        title: "Clarity before execution",
        text: "Scope, items and materials are defined and documented before any stage starts.",
      },
      {
        title: "Reviewable quality",
        text: "Clear work stages with quality checks at defined points — not just a final impression.",
      },
      {
        title: "Respect for space & owners",
        text: "An organised site and agreed working times wherever possible, with updates on any change.",
      },
    ],
    qualityTitle: "How Do We Care For Quality?",
    qualityText:
      "Quality for us is not a marketing word; it is practical steps: materials from trusted sources, execution in reviewed stages, and a final finish handed over after a joint detail review.",
    qualityPoints: [
      "Materials chosen for the actual use of the space",
      "Supervision and review of each stage before moving on",
      "A documented handover review with agreed snags addressed",
    ],
    workflowTitle: "Your Journey With Us",
  },
  services: {
    title: "Our Services",
    lead: "Integrated construction and finishing solutions that meet your needs with a high level of quality and execution precision.",
    detailIntro: "About this service",
    scopeTitle: "Scope of work",
    includesTitle: "Typically includes",
    excludesTitle: "Out of scope unless agreed",
    processTitle: "Execution steps",
    galleryTitle: "Illustrative materials & finishing imagery",
    faqTitle: "Service FAQs",
    sideTitle: "Interested in this service?",
    sideText:
      "Request a site inspection to discuss your actual needs and define the right scope before any commitment.",
  },
  projects: {
    title: "Our Projects",
    lead: "Selected work reflecting execution quality and attention to detail.",
    emptyTitle: "Approved projects will be published here",
    emptyText:
      "We are currently preparing approved projects for publication once documentation and details for each project are complete. We never present illustrative photos as completed work.",
    emptyCta: "Request an inspection for your project",
    scopeTitle: "Executed scope",
    galleryTitle: "Project gallery",
    metaTitle: "Project data",
  },
  request: {
    title: "Inspection / Quotation Request",
    lead: "Fill in the form and our team will contact you to arrange an inspection and discuss the details.",
    formTitle: "Send your request",
    formLead: "The clearer the details, the more accurate the inspection and proposal.",
    stepsTitle: "What happens after you submit?",
    steps: [
      {
        title: "Request review",
        text: "We review the details and prepare the key inspection points.",
      },
      { title: "We arrange a visit", text: "We contact you to agree a suitable inspection time." },
      {
        title: "Inspection & written proposal",
        text: "After the visit, a proposal is prepared with scope and suitable options.",
      },
    ],
    fields: {
      fullName: "Full name",
      phone: "Phone number",
      email: "Email (optional)",
      service: "Required service",
      servicePlaceholder: "Select a service",
      city: "City / Area",
      area: "Approximate area (m²) — optional",
      unitType: "Unit type",
      unitPlaceholder: "Select unit type",
      description: "Project details",
      descriptionHint:
        "Describe the current condition and what you want done — at least 20 characters.",
      consent:
        "I agree that Black X may contact me about this request, and confirm the details provided are accurate.",
      submit: "Submit request",
      submitting: "Submitting...",
      reset: "Submit another request",
    },
    unitTypes: ["Apartment", "Villa", "Duplex", "Office / Admin", "Commercial", "Other"],
    successTitle: "Request completed in preview only",
    successText:
      "The submission completed locally in this frontend preview only; the data was not delivered to the Black X team or stored in any system. Actual delivery will start after an approved backend is connected.",
    referenceLabel: "Preview reference number",
    errorTitle: "Submission could not be completed",
    errorText: "Something went wrong while preparing the request. Check the details and try again.",
    previewNote:
      "Note: this is a frontend review build — submission here is a demo and is not yet stored in a company system.",
  },
  contact: {
    title: "Contact Us",
    lead: "We welcome your enquiry and will help you start your project with a clear first step.",
    infoTitle: "General information",
    infoCards: [
      {
        title: "Inspection requests",
        text: "The fastest way to start any project is the inspection request form; contact will then be arranged around a suitable time.",
      },
      {
        title: "General enquiries",
        text: "For a general question about our services or process, use the contact form and we will reply through the official channels available at launch.",
      },
      {
        title: "Project follow-up",
        text: "Clients with ongoing projects can follow stages and reports through the client portal once their accounts are activated by the company.",
      },
    ],
    formTitle: "Send us a message",
    fields: {
      fullName: "Full name",
      phone: "Phone number",
      subject: "Subject",
      subjectPlaceholder: "Select a subject",
      message: "Your message",
      consent: "I agree to be contacted about this message.",
      submit: "Send message",
      submitting: "Sending...",
    },
    subjects: ["Service enquiry", "Inspection request", "Ongoing project follow-up", "Other"],
    successTitle: "Message completed in preview only",
    successText:
      "The message completed locally in this frontend preview only; it was not delivered or stored in any system. Actual delivery starts once the company's official contact channels are connected.",
    verifiedNote:
      "We do not publish phone numbers or email addresses here before they are officially approved by company management, so your messages never go to the wrong channels.",
  },
  articles: {
    title: "Articles",
    lead: "Practical content to help you understand finishing stages and choose well before you start.",
    emptyTitle: "No published articles yet",
    emptyText: "Articles approved by the Black X team will be published here over time.",
  },
  faqsPage: {
    title: "FAQs",
    lead: "Clear answers about requesting an inspection, preparing the proposal, and the execution and handover stages.",
  },
  validation: {
    required: "This field is required",
    nameShort: "Please enter your full name",
    phoneInvalid: "Invalid phone number — please enter correct digits",
    emailInvalid: "Invalid email format",
    areaInvalid: "Area must be a number greater than zero",
    descriptionShort:
      "Please add a bit more detail (at least 20 characters) so we can help accurately",
    messageShort: "Message is too short — please add a bit more detail",
    consentRequired: "Consent to contact is required before submitting",
  },
  footer: {
    tagline:
      "Integrated construction and finishing for homes and villas — clear scope, execution quality, and follow-up through to handover.",
    exploreTitle: "Explore",
    servicesTitle: "Our Services",
    companyTitle: "Company",
    rights: "© Black X Construction & Finishing. All rights reserved.",
    frontendNote:
      "Frontend review build — demo data is labelled inside the operations and portal sections.",
  },
  states: {
    notFoundTitle: "Page not found",
    notFoundText:
      "The link you opened is unavailable or has moved. Head back to the homepage and continue from there.",
    errorTitle: "Something went wrong",
    errorText:
      "Try refreshing the page. If the problem continues, contact us from the contact page.",
    retry: "Try again",
    loading: "Loading...",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { ar, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
