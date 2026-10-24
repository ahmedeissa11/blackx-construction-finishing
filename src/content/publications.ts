import type { Locale, LocalizedText } from "@/lib/i18n";

/** Approved published projects. Empty until the company approves real projects. */
export type PublishedProject = {
  slug: string;
  image: string;
  gallery: string[];
  title: LocalizedText;
  description: LocalizedText;
  scope: Record<Locale, string[]>;
  location?: LocalizedText;
  completedAt?: string;
  serviceSlugs: string[];
};

export const publishedProjects: PublishedProject[] = [];

export function getProject(slug: string): PublishedProject | undefined {
  return publishedProjects.find((p) => p.slug === slug);
}

/* ---------------- Articles (explicit preview content) ----------------
   These two articles are ILLUSTRATIVE PREVIEW content that demonstrates the
   article templates. They are labelled as preview content wherever shown and
   must be replaced by company-approved articles before production launch. */

export type Article = {
  slug: string;
  image: string;
  preview: boolean;
  readingMinutes: number;
  title: LocalizedText;
  excerpt: LocalizedText;
  body: Record<Locale, Array<{ heading?: string; paragraphs: string[]; bullets?: string[] }>>;
  relatedServiceSlugs: string[];
};

export const articles: Article[] = [
  {
    slug: "before-you-start-finishing",
    image: "/images/staircase.jpg",
    preview: true,
    readingMinutes: 5,
    title: {
      ar: "قبل ما تبدأ تشطيب: ٥ قرارات تحدد شكل التكلفة والنتيجة",
      en: "Before You Start Finishing: 5 Decisions That Shape Cost And Result",
    },
    excerpt: {
      ar: "أهم القرارات التي يُفضَّل حسمها قبل بدء أي أعمال تشطيب، حتى تتجنب التعديلات المكلفة في منتصف التنفيذ.",
      en: "The key decisions to settle before any finishing work starts, so you avoid costly mid-execution changes.",
    },
    body: {
      ar: [
        {
          paragraphs: [
            "أغلب مشكلات التشطيب لا تأتي من التنفيذ نفسه، بل من قرارات لم تُحسم قبل البدء: تعديل توزيع بعد تأسيس الكهرباء، أو تغيير خامة أرضية بعد شرائها. هذه خمسة قرارات تصنع الفارق بين مشروع هادئ ومشروع متعب.",
          ],
        },
        {
          heading: "١) التوزيع النهائي للفراغات والأثاث",
          paragraphs: [
            "أماكن الأثاث والأجهزة تحدد نقاط الكهرباء والسباكة والإضاءة. أي تغيير في التوزيع بعد التأسيس يعني تكسيرًا وإعادة عمل. ارسم التوزيع على الأبعاد الحقيقية قبل أي تأسيس.",
          ],
        },
        {
          heading: "٢) مستوى التشطيب المستهدف بصراحة",
          paragraphs: [
            "حدّد من البداية أين تصرف أكثر وأين يكفي حل عملي متوسط. الوضوح هنا يوجّه اختيار الخامات ويمنع استنزاف الميزانية في بنود لا تؤثر على استخدامك اليومي.",
          ],
        },
        {
          heading: "٣) البنود المخفية أولًا",
          paragraphs: [
            "السباكة والكهرباء والعزل بنود تُدفن تحت التشطيب ولا يمكن إصلاحها بسهولة لاحقًا.",
          ],
          bullets: [
            "اختبر شبكة المياه والصرف قبل تركيب السيراميك",
            "راجع توزيع مخارج الكهرباء على التوزيع النهائي",
            "وثّق مواقع التمديدات بالصور قبل الإغلاق",
          ],
        },
        {
          heading: "٤) نطاق عمل مكتوب قبل البدء",
          paragraphs: [
            "اطلب دائمًا مقترحًا مكتوبًا بالبنود والخامات ونطاق كل بند. الاتفاق الشفهي هو أشهر أسباب الخلافات والتكاليف «المفاجئة».",
          ],
        },
        {
          heading: "٥) احتياطي للتعديلات المدروسة",
          paragraphs: [
            "اترك هامشًا صغيرًا في الميزانية لقرارات قد تتغير بعد رؤية عينات على الطبيعة — لكن اجعل كل تعديل موثقًا ومعتمدًا كتابيًا قبل تنفيذه.",
          ],
        },
      ],
      en: [
        {
          paragraphs: [
            "Most finishing problems do not come from execution itself, but from decisions left open after work starts: changing the layout after electrical rough-ins, or swapping a floor material after purchase. These five decisions make the difference between a calm project and a draining one.",
          ],
        },
        {
          heading: "1) Final layout of rooms and furniture",
          paragraphs: [
            "Furniture and appliance positions define electrical, plumbing and lighting points. Any layout change after rough-ins means breaking and redoing work. Draw the layout at true dimensions before any rough-in.",
          ],
        },
        {
          heading: "2) Be honest about the target finish level",
          paragraphs: [
            "Decide upfront where to spend more and where a practical mid-range solution is enough. This clarity guides material choices and stops the budget leaking into items that do not affect daily use.",
          ],
        },
        {
          heading: "3) Hidden works first",
          paragraphs: [
            "Plumbing, electrical and waterproofing are buried under finishes and cannot be fixed easily later.",
          ],
          bullets: [
            "Test water and drainage before tiling",
            "Check electrical outlets against the final layout",
            "Photograph runs before closing them up",
          ],
        },
        {
          heading: "4) A written scope before starting",
          paragraphs: [
            "Always ask for a written proposal with items, materials and the scope of each item. Verbal agreements are the most common cause of disputes and 'surprise' costs.",
          ],
        },
        {
          heading: "5) A small reserve for considered changes",
          paragraphs: [
            "Keep a small budget margin for decisions that may change after seeing samples in real light — but make every change documented and approved in writing before execution.",
          ],
        },
      ],
    },
    relatedServiceSlugs: ["interior-finishing", "plumbing-bathrooms"],
  },
  {
    slug: "choosing-finishing-materials",
    image: "/images/stone-detail.jpg",
    preview: true,
    readingMinutes: 4,
    title: {
      ar: "إزاي تختار خامات التشطيب من غير ما تضيع بين الشكل والسعر؟",
      en: "How To Choose Finishing Materials Without Getting Lost Between Look And Price",
    },
    excerpt: {
      ar: "طريقة عملية للمقارنة بين خامات التشطيب: الاستخدام الفعلي أولًا، ثم العمر الافتراضي وسهولة الصيانة، ثم الشكل.",
      en: "A practical way to compare finishing materials: real use first, then lifespan and maintenance, then looks.",
    },
    body: {
      ar: [
        {
          paragraphs: [
            "سوق خامات التشطيب مليء ببدائل متشابهة شكلًا ومختلفة تمامًا في الأداء. الترتيب التالي في المقارنة يساعدك تختار بثقة دون إفراط في الصرف أو تنازل مؤلم لاحقًا.",
          ],
        },
        {
          heading: "ابدأ من الاستخدام لا من الصورة",
          paragraphs: [
            "أرضية مدخل رئيسي يمرّ عليها الجميع يوميًا ليست كأرضية غرفة نوم. كلما زاد الاحتكاك والرطوبة المتوقعة، قدّم مقاومة الخامة وسهولة تنظيفها على شكلها.",
          ],
        },
        {
          heading: "اسأل عن الصيانة قبل الشراء",
          paragraphs: [
            "بعض الخامات الجميلة تحتاج عناية دورية مكلفة أو منتجات تنظيف خاصة. اعرف دورة صيانتها وتكلفتها التقريبية قبل اعتمادها.",
          ],
          bullets: [
            "هل تحتاج معالجة أو عزلًا دوريًا؟",
            "كيف تتأثر بالمياه والشمس المباشرة؟",
            "هل تتوفر قطع غيار/كميات لاحقة بنفس الدرجة؟",
          ],
        },
        {
          heading: "جرّب العينة في إضاءة المكان",
          paragraphs: [
            "ألوان الدهانات والحجر تتغير بين إضاءة المعرض وإضاءة بيتك. اطلب عينة وراقبها نهارًا ومساءً في المساحة الفعلية قبل اعتماد الكمية كاملة.",
          ],
        },
        {
          heading: "وثّق اختيارك في المقترح",
          paragraphs: [
            "الخامة المعتمدة (النوع والدرجة واللون) يجب أن تُكتب في المقترح أو محضر اعتماد، حتى يكون ما يصلك في الموقع هو ما وافقت عليه بالضبط.",
          ],
        },
      ],
      en: [
        {
          paragraphs: [
            "The finishing materials market is full of lookalikes that perform very differently. Comparing in this order helps you choose confidently, without overspending or painful compromises later.",
          ],
        },
        {
          heading: "Start from use, not from the picture",
          paragraphs: [
            "A main entrance floor walked on all day is not a bedroom floor. The more friction and moisture expected, the more a material's resistance and ease of cleaning should outrank its looks.",
          ],
        },
        {
          heading: "Ask about maintenance before buying",
          paragraphs: [
            "Some beautiful materials need costly periodic care or special cleaning products. Learn their maintenance cycle and rough cost before approving them.",
          ],
          bullets: [
            "Does it need periodic treatment or sealing?",
            "How does it react to water and direct sun?",
            "Will matching replacements be available in the same grade later?",
          ],
        },
        {
          heading: "Test the sample in the space's own light",
          paragraphs: [
            "Paint and stone colours shift between showroom lighting and your home. Ask for a sample and watch it day and evening in the actual space before approving the full quantity.",
          ],
        },
        {
          heading: "Document your choice in the proposal",
          paragraphs: [
            "The approved material (type, grade and colour) should be written into the proposal or an approval record, so what arrives on site is exactly what you approved.",
          ],
        },
      ],
    },
    relatedServiceSlugs: ["materials-supply", "interior-finishing", "exterior-facades"],
  },
];

export const publishedArticles: Article[] = articles.filter((article) => !article.preview);

export function getArticle(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}

/* ---------------- FAQs (general process answers only) ---------------- */

export const faqs: Array<{ q: LocalizedText; a: LocalizedText }> = [
  {
    q: { ar: "كيف أطلب معاينة لموقعي؟", en: "How do I request a site inspection?" },
    a: {
      ar: "من خلال نموذج «طلب معاينة / عرض سعر»: املأ بيانات التواصل ونوع الخدمة ونبذة عن المشروع، وسيتم التواصل معك لترتيب موعد مناسب للمعاينة ومناقشة الاحتياجات على الطبيعة.",
      en: "Use the 'Inspection / Quotation Request' form: fill in your contact details, the service and a short project brief, and we will contact you to arrange a suitable inspection time to discuss needs on site.",
    },
  },
  {
    q: { ar: "ماذا يحدث بعد إرسال الطلب؟", en: "What happens after I submit a request?" },
    a: {
      ar: "تتم مراجعة بيانات طلبك أولًا، ثم التواصل لتأكيد التفاصيل وترتيب المعاينة. بعد المعاينة يُعدّ مقترح مكتوب بنطاق العمل والخيارات المناسبة لمراجعته واعتماده قبل أي تنفيذ. ملحوظة: نسخة الموقع الحالية واجهة للمراجعة، والإرسال داخلها تجريبي إلى حين ربط النظام الفعلي.",
      en: "Your request is reviewed first, then we confirm details and arrange the inspection. After the visit, a written proposal with scope and suitable options is prepared for your review and approval before any execution. Note: the current site build is a review frontend, so submission inside it is a demo until the live system is connected.",
    },
  },
  {
    q: { ar: "هل عرض السعر ملزم قبل المعاينة؟", en: "Is a quotation binding before inspection?" },
    a: {
      ar: "أي أرقام دقيقة تحتاج معاينة فعلية لحالة الموقع ومساحته وخاماته المختارة. المقترح المكتوب بعد المعاينة هو المرجع الذي يُبنى عليه الاتفاق، ويوضح البنود المشمولة وما هو خارج النطاق.",
      en: "Accurate figures need an actual inspection of the site's condition, area and chosen materials. The written proposal after inspection is the reference for any agreement, clarifying what is included and what is out of scope.",
    },
  },
  {
    q: { ar: "هل يمكنني تعديل بنود أثناء التنفيذ؟", en: "Can I change items during execution?" },
    a: {
      ar: "يمكن ذلك بالاتفاق، بشرط توثيق التعديل كتابيًا (وصفه وأثره على التكلفة والمدة) واعتماده قبل تنفيذ الجزء المعدَّل، حفاظًا على وضوح العلاقة بين الطرفين.",
      en: "Yes, by agreement — provided the change is documented in writing (its description and cost/time impact) and approved before the changed part is executed, keeping everything clear for both sides.",
    },
  },
  {
    q: {
      ar: "من يورّد الخامات: الشركة أم العميل؟",
      en: "Who supplies the materials: the company or the client?",
    },
    a: {
      ar: "الأصل أن تتولى الشركة توريد الخامات المدرجة في المقترح لضمان توافقها مع التنفيذ. ويمكن الاتفاق على توريد العميل لبنود محددة بشرط مراجعة قبولها فنيًا وتوثيق المسؤوليات في المقترح.",
      en: "By default the company supplies the materials listed in the proposal to ensure execution compatibility. Client supply of specific items can be agreed, subject to technical acceptance review and documenting responsibilities in the proposal.",
    },
  },
  {
    q: {
      ar: "كيف تتم متابعة تقدم المشروع والتسليم؟",
      en: "How are project progress and handover handled?",
    },
    a: {
      ar: "يُنفَّذ العمل على مراحل تُراجَع تباعًا، وعند الانتهاء تتم مراجعة تسليم مشتركة لبنود العمل ومعالجة الملاحظات المتفق عليها. وفي المنظومة الكاملة، تتيح بوابة العميل متابعة المراحل والتقارير والمستندات لحسابات العملاء المفعّلة.",
      en: "Work is executed in stages that are reviewed as they complete, and at the end a joint handover review covers the work items and any agreed snags. In the full system, the client portal lets activated client accounts follow milestones, reports and documents.",
    },
  },
];
