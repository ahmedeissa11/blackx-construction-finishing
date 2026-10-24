import type { Locale, LocalizedText } from "@/lib/i18n";

export type LocalizedList = Record<Locale, string[]>;

export type Service = {
  slug: string;
  image: string;
  gallery: string[];
  title: LocalizedText;
  summary: LocalizedText;
  intro: LocalizedText;
  scope: LocalizedList;
  includes: LocalizedList;
  excludes: LocalizedList;
  steps: LocalizedList;
  faqs: Array<{ q: LocalizedText; a: LocalizedText }>;
};

const genericSteps: LocalizedList = {
  ar: [
    "معاينة الموقع وفهم الاحتياجات",
    "مقترح مكتوب بنطاق العمل والخيارات",
    "اعتماد الخامات والبنود قبل التنفيذ",
    "تنفيذ مرحلي بإشراف ومتابعة",
    "مراجعة جودة وتسليم موثّق",
  ],
  en: [
    "Site inspection and needs assessment",
    "A written proposal with scope and options",
    "Materials and items approved before execution",
    "Staged execution with supervision and follow-up",
    "Quality review and documented handover",
  ],
};

export const services: Service[] = [
  {
    slug: "interior-finishing",
    image: "/images/interior-living.jpg",
    gallery: ["/images/interior-living.jpg", "/images/bedroom.jpg", "/images/staircase.jpg"],
    title: { ar: "التشطيبات الداخلية", en: "Interior Finishing" },
    summary: {
      ar: "تشطيب متكامل للمنازل والفلل من الأعمال التأسيسية حتى أدق تفاصيل التشطيب النهائي.",
      en: "Complete interior finishing for homes and villas, from foundational works to the finest final details.",
    },
    intro: {
      ar: "نقدّم جميع أعمال التشطيبات الداخلية للوحدات السكنية — من المحارة والأسقف والأرضيات إلى الدهانات وأعمال الخشب والإضاءة — بمراحل تنفيذ واضحة ومراجعة جودة في كل مرحلة، مع اهتمام فعلي بأدق التفاصيل التي تظهر في الاستخدام اليومي.",
      en: "We deliver the full range of interior finishing works for residential units — plastering, ceilings and flooring through to paints, woodwork and lighting — in clear execution stages with quality checks at every stage, paying real attention to the details that show in everyday use.",
    },
    scope: {
      ar: [
        "محارة وتأسيسات",
        "أسقف وأعمال جبس",
        "أرضيات وحجر ورخام",
        "دهانات وتشطيبات نهائية",
        "أعمال خشب وأبواب",
      ],
      en: [
        "Plastering & foundations",
        "Ceilings & gypsum works",
        "Flooring, stone & marble",
        "Paints & final finishes",
        "Woodwork & doors",
      ],
    },
    includes: {
      ar: [
        "معاينة وتقييم حالة الوحدة الحالية",
        "تنفيذ بنود التشطيب المتفق عليها كتابيًا",
        "إشراف ومراجعة جودة لكل مرحلة",
        "تنظيف موقع العمل عند نهاية كل مرحلة رئيسية",
      ],
      en: [
        "Inspection and assessment of the current unit condition",
        "Execution of the finishing items agreed in writing",
        "Supervision and quality review of every stage",
        "Worksite cleaning at the end of each main stage",
      ],
    },
    excludes: {
      ar: [
        "الأثاث والأجهزة ما لم تُدرَج صراحة في العرض",
        "أعمال إنشائية أو تراخيص رسمية خارج النطاق المتفق عليه",
        "تعديلات إضافية بعد الاعتماد — تُسعَّر وتُعتمَد كتابيًا أولًا",
      ],
      en: [
        "Furniture and appliances unless explicitly included in the proposal",
        "Structural works or official permits outside the agreed scope",
        "Extra changes after approval — priced and approved in writing first",
      ],
    },
    steps: genericSteps,
    faqs: [
      {
        q: { ar: "هل يمكن تشطيب وحدة على مراحل؟", en: "Can a unit be finished in stages?" },
        a: {
          ar: "نعم، يمكن تقسيم العمل على مراحل متفق عليها (مثل التأسيسات ثم التشطيبات النهائية) بشرط توثيق بنود كل مرحلة في المقترح حتى تكون التكلفة والمسؤوليات واضحة.",
          en: "Yes. Work can be split into agreed stages (e.g. foundations, then final finishes) provided each stage's items are documented in the proposal so cost and responsibilities stay clear.",
        },
      },
      {
        q: { ar: "كيف يتم تحديد نطاق التشطيب؟", en: "How is the finishing scope defined?" },
        a: {
          ar: "بعد المعاينة يتم إعداد مقترح مكتوب يوضح البنود والخامات المقترحة لكل بند. التنفيذ يبدأ بعد اعتمادك للمقترح، وأي تعديل لاحق يتم باتفاق مكتوب.",
          en: "After inspection we prepare a written proposal listing items and suggested materials per item. Execution starts after your approval, and any later change is agreed in writing.",
        },
      },
    ],
  },
  {
    slug: "kitchens",
    image: "/images/kitchen.jpg",
    gallery: ["/images/kitchen.jpg", "/images/stone-detail.jpg", "/images/interior-living.jpg"],
    title: { ar: "المطابخ", en: "Kitchens" },
    summary: {
      ar: "تصميم وتنفيذ مطابخ عملية تجمع بين راحة الاستخدام اليومي وجودة الخامات ودقة التركيب.",
      en: "Practical kitchen design and execution combining everyday usability, material quality and installation precision.",
    },
    intro: {
      ar: "نصمم وننفّذ مطابخ عصرية وعملية مبنية على طريقة استخدامك الفعلية: توزيع مدروس لمناطق العمل، خامات تتحمل الاستخدام اليومي، وتشطيب دقيق في التركيب والمقاسات. نبدأ بفهم احتياجاتك ومساحة المطبخ، ثم نقترح توزيعًا وخامات مناسبة قبل التنفيذ.",
      en: "We design and build modern, practical kitchens around how you actually cook: a considered work-zone layout, materials that withstand daily use, and precise fitting and measurements. We start by understanding your needs and space, then propose layout and materials before execution.",
    },
    scope: {
      ar: [
        "تصميم وتوزيع المطبخ",
        "وحدات تخزين وخزائن",
        "أسطح عمل حجر ورخام",
        "تأسيسات سباكة وكهرباء مرتبطة",
        "تركيب وتشطيب نهائي",
      ],
      en: [
        "Kitchen design & layout",
        "Storage units & cabinetry",
        "Stone & marble worktops",
        "Related plumbing & electrical rough-ins",
        "Installation & final finishing",
      ],
    },
    includes: {
      ar: [
        "رفع مقاسات الموقع ومراجعة التوزيع المقترح معك",
        "تصنيع/توريد الوحدات بحسب الخامات المعتمدة",
        "تركيب الأسطح والوحدات وضبط المقاسات",
        "مراجعة تشغيل نقاط المياه والصرف المرتبطة بالمطبخ",
      ],
      en: [
        "Site measurements and layout review with you",
        "Manufacture/supply of units in the approved materials",
        "Worktop and unit installation with precise fitting",
        "Checking kitchen water and drainage points",
      ],
    },
    excludes: {
      ar: [
        "الأجهزة الكهربائية ما لم تُدرَج في العرض",
        "تعديلات إنشائية في الحوائط خارج الاتفاق",
        "أي بنود إضافية بعد اعتماد المخطط — تُتفق كتابيًا",
      ],
      en: [
        "Electrical appliances unless included in the proposal",
        "Structural wall modifications outside the agreement",
        "Any extra items after layout approval — agreed in writing",
      ],
    },
    steps: genericSteps,
    faqs: [
      {
        q: {
          ar: "هل يتم تصميم المطبخ قبل التنفيذ؟",
          en: "Is the kitchen designed before execution?",
        },
        a: {
          ar: "نعم. بعد رفع المقاسات وفهم أسلوب استخدامك، يتم عرض التوزيع والخامات المقترحة لاعتمادها قبل بدء التصنيع أو التركيب.",
          en: "Yes. After measurements and understanding how you use the kitchen, the layout and proposed materials are presented for your approval before manufacture or installation.",
        },
      },
      {
        q: {
          ar: "هل يمكن تجديد مطبخ قائم فقط دون تغيير كامل؟",
          en: "Can an existing kitchen be partially renewed?",
        },
        a: {
          ar: "يمكن ذلك بحسب حالة الوحدات الحالية. في المعاينة نقيّم ما يمكن الاحتفاظ به وما يُفضَّل تغييره، ويُنعكس ذلك بوضوح في المقترح.",
          en: "That depends on the condition of the current units. During inspection we assess what can stay and what is better replaced, and reflect that clearly in the proposal.",
        },
      },
    ],
  },
  {
    slug: "plumbing-bathrooms",
    image: "/images/bathroom.jpg",
    gallery: ["/images/bathroom.jpg", "/images/stone-detail.jpg", "/images/bedroom.jpg"],
    title: { ar: "السباكة والحمامات", en: "Plumbing & Bathrooms" },
    summary: {
      ar: "تأسيس وتشطيب الحمامات وأعمال السباكة المرتبطة بها بمعايير جودة وأمان عالية.",
      en: "Bathroom installation and finishing with the related plumbing works, to high quality and safety standards.",
    },
    intro: {
      ar: "تنفيذ وتشطيب أعمال السباكة والحمامات يشمل التأسيس الصحيح لشبكات التغذية والصرف، العزل عند الحاجة، وتركيب الأدوات الصحية والتشطيبات النهائية بعناية — لأن أخطاء هذا البند تحديدًا تظهر متأخرًا وتكلّف كثيرًا، لذلك نختبر ونراجع قبل الإغلاق والتشطيب.",
      en: "Our plumbing and bathroom works cover correct supply and drainage rough-ins, waterproofing where needed, and careful installation of sanitaryware and final finishes — because mistakes in this trade appear late and cost a lot, we test and review before closing and finishing.",
    },
    scope: {
      ar: [
        "تأسيس تغذية وصرف",
        "عزل أرضيات الحمامات",
        "تركيب أدوات صحية",
        "سيراميك وحجر للحمامات",
        "اختبار ومراجعة قبل التشطيب",
      ],
      en: [
        "Supply & drainage rough-ins",
        "Bathroom floor waterproofing",
        "Sanitaryware installation",
        "Bathroom ceramics & stone",
        "Testing before finishing",
      ],
    },
    includes: {
      ar: [
        "مراجعة حالة الشبكة الحالية عند التجديد",
        "تأسيس أو تعديل نقاط التغذية والصرف المتفق عليها",
        "اختبار ضغط/تصريف قبل أعمال التشطيب",
        "تركيب الأدوات الصحية المدرجة في العرض",
      ],
      en: [
        "Review of the existing network on renovation work",
        "Installation or modification of agreed supply/drainage points",
        "Pressure/drainage testing before finishing works",
        "Installation of sanitaryware listed in the proposal",
      ],
    },
    excludes: {
      ar: [
        "سخانات أو أدوات غير مدرجة في العرض",
        "مشكلات في شبكة المبنى الرئيسية خارج وحدتك",
        "أعمال خارج الحمامات/المطابخ المتفق عليها ما لم تُضَف كتابيًا",
      ],
      en: [
        "Heaters or fixtures not listed in the proposal",
        "Issues in the building's main network outside your unit",
        "Works outside the agreed bathrooms/kitchens unless added in writing",
      ],
    },
    steps: genericSteps,
    faqs: [
      {
        q: {
          ar: "هل يتم اختبار السباكة قبل تشطيب الحمام؟",
          en: "Is plumbing tested before bathroom finishing?",
        },
        a: {
          ar: "نعم، الاختبار قبل الإغلاق والتشطيب خطوة أساسية في منهجية العمل، لأن اكتشاف أي مشكلة بعد تركيب السيراميك يضاعف التكلفة والوقت.",
          en: "Yes. Testing before closing and finishing is a core step in our method, because finding a problem after tiling multiplies cost and time.",
        },
      },
      {
        q: {
          ar: "هل يمكن تغيير توزيع الحمام القائم؟",
          en: "Can an existing bathroom layout be changed?",
        },
        a: {
          ar: "غالبًا يمكن تعديل التوزيع في حدود إمكانيات الصرف والتغذية بالموقع. المعاينة تحسم ما هو ممكن تقنيًا وما أثره على التكلفة والمدة.",
          en: "Layout changes are usually possible within the site's drainage and supply constraints. The inspection determines what is technically feasible and its cost/time impact.",
        },
      },
    ],
  },
  {
    slug: "exterior-facades",
    image: "/images/facade-detail.jpg",
    gallery: ["/images/facade-detail.jpg", "/images/hero-villa.jpg", "/images/stone-detail.jpg"],
    title: { ar: "التشطيبات الخارجية والواجهات", en: "Exterior Finishing & Facades" },
    summary: {
      ar: "تشطيب واجهات بحجر ودهانات خارجية وتفاصيل معمارية تتحمل عوامل الطقس وتحافظ على المظهر.",
      en: "Facade finishing with stone, exterior paints and architectural details that withstand the weather and keep their look.",
    },
    intro: {
      ar: "أعمال التشطيبات الخارجية والواجهات تشمل معالجة وتكسية الواجهات بالحجر أو الدهانات الخارجية المتخصصة، مع الاهتمام بتفاصيل الحواف والمداخل والتناسق العام للمبنى. نختار الخامات والأنظمة بما يناسب التعرض الفعلي للشمس والرطوبة في موقعك.",
      en: "Exterior and facade works include treating and cladding facades in stone or specialised exterior paint systems, with attention to edges, entrances and the building's overall harmony. Materials and systems are chosen for your site's actual sun and moisture exposure.",
    },
    scope: {
      ar: [
        "واجهات حجر طبيعي",
        "دهانات خارجية متخصصة",
        "معالجة فواصل وشروخ سطحية",
        "تفاصيل مداخل وأسوار",
        "تشطيب أسطح خارجية مرتبطة",
      ],
      en: [
        "Natural stone facades",
        "Specialised exterior paints",
        "Joint & surface crack treatment",
        "Entrance & boundary details",
        "Related exterior surface finishing",
      ],
    },
    includes: {
      ar: [
        "معاينة الواجهة وتقييم حالة الأسطح",
        "تجهيز الأسطح قبل التكسية أو الدهان",
        "تنفيذ بنود الواجهة المتفق عليها كتابيًا",
        "مراجعة نهائية للتشطيب والتفاصيل",
      ],
      en: [
        "Facade inspection and surface assessment",
        "Surface preparation before cladding or painting",
        "Execution of facade items agreed in writing",
        "Final review of finishing and details",
      ],
    },
    excludes: {
      ar: [
        "أعمال إنشائية لتعديل الفتحات ما لم تُتفق صراحة",
        "تراخيص أو موافقات إدارة الحي/المجمع",
        "أعمال إنارة خارجية واسعة خارج النطاق المتفق عليه",
      ],
      en: [
        "Structural opening modifications unless explicitly agreed",
        "District/compound permits and approvals",
        "Extensive exterior lighting outside the agreed scope",
      ],
    },
    steps: genericSteps,
    faqs: [
      {
        q: {
          ar: "الحجر أفضل ولا الدهانات الخارجية للواجهة؟",
          en: "Is stone or exterior paint better for facades?",
        },
        a: {
          ar: "الاختيار يعتمد على تصميم المبنى وميزانيتك وطريقة الصيانة المفضلة. في المعاينة نشرح مزايا كل خيار لحالتك، والقرار النهائي يُوثَّق في المقترح.",
          en: "It depends on the building design, your budget and preferred maintenance. At inspection we explain each option for your case, and the final choice is documented in the proposal.",
        },
      },
      {
        q: {
          ar: "هل تحتاج الواجهة تجهيزًا قبل التنفيذ؟",
          en: "Does the facade need preparation first?",
        },
        a: {
          ar: "نعم، تجهيز السطح (تنظيف ومعالجة العيوب السطحية) شرط أساسي لالتصاق الخامة وثبات مظهرها، ويُدرَج كبند واضح في نطاق العمل.",
          en: "Yes. Surface preparation (cleaning and treating surface defects) is essential for adhesion and lasting appearance, and is listed clearly in the scope.",
        },
      },
    ],
  },
  {
    slug: "building-restoration",
    image: "/images/hero-villa.jpg",
    gallery: ["/images/hero-villa.jpg", "/images/facade-detail.jpg", "/images/staircase.jpg"],
    title: { ar: "البناء وإعادة الترميم", en: "Building & Restoration" },
    summary: {
      ar: "أعمال بناء وتجديد وترميم للوحدات القائمة بإشراف متخصص ومراحل عمل موثّقة.",
      en: "Building, renovation and restoration works for existing units, with specialised supervision and documented stages.",
    },
    intro: {
      ar: "نتولى أعمال البناء المرتبطة بالوحدات السكنية وتجديد وترميم الوحدات القائمة: من هدم وتجهيز وإعادة تقسيم المساحات إلى إعادة تأهيل الأسطح والتشطيبات. كل عمل يبدأ بمعاينة تقنية لفرق ما هو تجميلي وما يحتاج معالجة حقيقية قبل أي تشطيب.",
      en: "We handle residential building works and the renovation and restoration of existing units: demolition, preparation and re-partitioning through to surface rehabilitation and re-finishing. Every job starts with a technical inspection separating cosmetic work from what truly needs treatment before finishing.",
    },
    scope: {
      ar: [
        "هدم وتجهيز مواقع",
        "مبانٍ وتقسيمات داخلية",
        "ترميم ومعالجة أسطح",
        "تجديد وحدات قائمة",
        "إعادة تشطيب بعد الترميم",
      ],
      en: [
        "Demolition & site preparation",
        "Internal blockwork & partitioning",
        "Surface repair & restoration",
        "Existing-unit renovation",
        "Re-finishing after restoration",
      ],
    },
    includes: {
      ar: [
        "معاينة تقنية وتوصية مكتوبة بنطاق العمل",
        "أعمال الهدم والتجهيز المدرجة في العرض",
        "إدارة مخلفات الموقع ضمن النطاق المتفق عليه",
        "تسليم مرحلي موثّق قبل أعمال التشطيب التالية",
      ],
      en: [
        "Technical inspection with a written scope recommendation",
        "Demolition and preparation listed in the proposal",
        "Site waste management within the agreed scope",
        "Documented stage sign-off before subsequent finishing",
      ],
    },
    excludes: {
      ar: [
        "تدعيم إنشائي متخصص يحتاج تصميمًا إنشائيًا معتمدًا — يُحال لمختص عند الحاجة",
        "التراخيص الحكومية وموافقات التعديل",
        "أي أعمال مخفية تظهر أثناء الهدم — تُبلَّغ وتُسعَّر قبل التنفيذ",
      ],
      en: [
        "Specialist structural strengthening needing certified structural design — referred to a specialist when required",
        "Government permits and modification approvals",
        "Any hidden works revealed during demolition — reported and priced before execution",
      ],
    },
    steps: genericSteps,
    faqs: [
      {
        q: {
          ar: "هل يمكن أن تظهر أعمال إضافية أثناء الترميم؟",
          en: "Can extra work appear during restoration?",
        },
        a: {
          ar: "نعم، أحيانًا تظهر حالات مخفية بعد الكشف (رطوبة قديمة أو تأسيسات تالفة). التزامنا أن نُبلّغك فورًا بصور ووصف واضح، ولا يتم تنفيذ أي بند إضافي إلا باعتماد مكتوب.",
          en: "Yes — hidden conditions sometimes appear after opening up (old damp or damaged rough-ins). We commit to informing you immediately with photos and a clear description, and no extra item is executed without written approval.",
        },
      },
      {
        q: {
          ar: "هل تنفذون التراخيص نيابة عن العميل؟",
          en: "Do you obtain permits on the client's behalf?",
        },
        a: {
          ar: "التراخيص والموافقات الرسمية مسؤولية مالك الوحدة، ويمكننا توضيح ما قد يحتاجه نوع العمل عادةً خلال المعاينة حتى تستعد له مبكرًا.",
          en: "Official permits and approvals are the unit owner's responsibility. We can clarify what your type of work usually requires during inspection so you can prepare early.",
        },
      },
    ],
  },
  {
    slug: "materials-supply",
    image: "/images/stone-detail.jpg",
    gallery: ["/images/stone-detail.jpg", "/images/kitchen.jpg", "/images/bathroom.jpg"],
    title: { ar: "توريد المواد", en: "Materials Supply" },
    summary: {
      ar: "توريد خامات بناء وتشطيب مختارة بعناية من مصادر موثوقة، ضمن أعمالنا أو كمادة لمشروعك.",
      en: "Supply of carefully selected building and finishing materials from trusted sources, within our works or for your project.",
    },
    intro: {
      ar: "نوفر توريد خامات البناء والتشطيب المرتبطة بأعمالنا — حجر، سيراميك، خامات تشطيب وخامات تأسيس — باختيار مبني على ملاءمتها للاستخدام الفعلي وليس الشكل فقط. ترتبط هذه الخدمة عادة بمشاريع التنفيذ لضمان توافق الخامة مع طريقة التركيب والضمانات العملية.",
      en: "We supply the building and finishing materials tied to our works — stone, ceramics, finishing and rough-in materials — selected for real-use suitability, not looks alone. This service usually accompanies execution projects to ensure material/installation compatibility and practical warranties.",
    },
    scope: {
      ar: [
        "حجر ورخام",
        "سيراميك وبورسلين",
        "خامات تأسيس سباكة وكهرباء",
        "دهانات وتشطيبات",
        "خامات أسقف وأرضيات",
      ],
      en: [
        "Stone & marble",
        "Ceramics & porcelain",
        "Plumbing & electrical materials",
        "Paints & finishes",
        "Ceiling & flooring materials",
      ],
    },
    includes: {
      ar: [
        "ترشيح خيارات مناسبة لميزانيتك واستخدامك",
        "عينات أو بيانات المنتج عند التوفر قبل الاعتماد",
        "توريد الكميات المتفق عليها للموقع",
        "مراجعة مطابقة المورد عند الاستلام داخل أعمالنا",
      ],
      en: [
        "Options matched to your budget and use",
        "Samples or product data where available before approval",
        "Delivery of agreed quantities to site",
        "Conformity check on receipt within our works",
      ],
    },
    excludes: {
      ar: [
        "تركيب خامات مُورَّدة من الغير دون مراجعة مسبقة لقبولها",
        "تخزين طويل الأمد بالموقع خارج جدول التنفيذ",
        "فروق أسعار بعد الاعتماد — تُثبَّت في العرض المعتمد",
      ],
      en: [
        "Installing third-party materials without prior acceptance review",
        "Long-term on-site storage outside the execution schedule",
        "Price differences after approval — fixed in the approved proposal",
      ],
    },
    steps: genericSteps,
    faqs: [
      {
        q: {
          ar: "هل يمكنني شراء الخامات بنفسي وأنتم تنفذون فقط؟",
          en: "Can I buy materials myself while you execute only?",
        },
        a: {
          ar: "يمكن الاتفاق على ذلك لبنود محددة بشرط مراجعة قبول الخامة فنيًا قبل التركيب وتوثيق المسؤولية عن جودة التوريد في المقترح، حتى تكون الأدوار واضحة للطرفين.",
          en: "That can be agreed for specific items, provided the material is technically accepted before installation and supply-quality responsibility is documented in the proposal so roles stay clear for both sides.",
        },
      },
      {
        q: { ar: "كيف يتم تثبيت سعر الخامات؟", en: "How are material prices fixed?" },
        a: {
          ar: "أسعار الخامات المدرجة في المقترح المعتمد تُثبَّت لبنودها المتفق عليها. أي تغيير في النوع أو الكمية بعد الاعتماد يتم باتفاق مكتوب جديد.",
          en: "Material prices in the approved proposal are fixed for their agreed items. Any change of type or quantity after approval is handled with a new written agreement.",
        },
      },
    ],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}
