// P5 : tous les textes de l'assistant, sur un ton de conversation.
// Fonctions pures : faciles a modifier et a tester. Plusieurs formulations pour ne pas se repeter.
import { formatDay, formatTime, languageOf, localeOf, localized } from './locale'
import { formatSlot } from './mockSlots'

const pad = (n) => String(n).padStart(2, '0')
export const pick = (list) => list[Math.floor(Math.random() * list.length)]

export const fmtDuration = (min, lang = 'fr') => {
  const hours = Math.floor(min / 60)
  const minutes = min % 60
  if (languageOf(lang) === 'fr') {
    return minutes === 0 ? `${hours} h` : min < 60 ? `${min} min` : `${hours} h ${pad(minutes)}`
  }
  if (languageOf(lang) === 'en') {
    return minutes === 0
      ? `${hours} ${hours === 1 ? 'hour' : 'hours'}`
      : min < 60
        ? `${min} minutes`
        : `${hours} h ${minutes} min`
  }
  return minutes === 0 ? `${hours} ساعات` : min < 60 ? `${min} دقيقة` : `${hours} س ${pad(minutes)} د`
}

export const listClashes = (clashes, lang = 'fr') =>
  clashes
    .map((c) => {
      if (languageOf(lang) === 'fr') return `« ${c.title} » (${formatSlot(c.start, c.durationMin)})`
      const start = new Date(c.start)
      const day = start.toLocaleDateString(localeOf(lang), { weekday: 'long', day: 'numeric', month: 'short' })
      const end = start.getTime() + (Number(c.durationMin) || 0) * 60000
      return `« ${c.title} » (${day}, ${formatTime(start, lang)} – ${formatTime(end, lang)})`
    })
    .join(', ')

export const greeting = (lang = 'fr') =>
  localized(
    lang,
    'Bonjour ! Dites-moi ce que vous avez à faire et je trouve le bon moment.',
    'Hello! Tell me what you need to do and I’ll find a good time.',
    'مرحبًا! أخبرني بما تريد إنجازه وسأجد لك وقتًا مناسبًا.',
  )

export const thanks = (lang = 'fr') =>
  localized(
    lang,
    'Avec plaisir ! Dites-moi si vous avez autre chose à planifier.',
    'You’re welcome! Tell me if there’s anything else you’d like to plan.',
    'على الرحب والسعة! أخبرني إن كان لديك شيء آخر تريد التخطيط له.',
  )

export const outOfScope = (lang = 'fr') =>
  localized(
    lang,
    "Je peux seulement t'aider à planifier ton emploi du temps. Dis-moi ce que tu veux ajouter ou modifier.",
    'I can only help you plan your schedule. Tell me what you’d like to add or change.',
    'يمكنني مساعدتك فقط في تخطيط جدولك. أخبرني بما تريد إضافته أو تعديله.',
  )

// Question posee quand il manque une information (field : 'title', 'time', 'deadline' ou 'duration')
// task : permet d'adapter la question de titre a la categorie (cours, reunion...)
export function question(field, task, lang = 'fr') {
  if (field === 'title') {
    if (languageOf(lang) === 'fr') {
      const byCategory = {
        cours: ['Quel cours est-ce ? Par exemple « maths » ou « physique ».', "D'accord ! C'est quel cours ?"],
        revision: ['Vous révisez quelle matière ?', "D'accord ! Vous révisez quoi exactement ?"],
        reunion: ['Cette réunion porte sur quel sujet ?', "D'accord ! C'est une réunion sur quoi ?"],
        projet: ["C'est pour quel projet ?", "D'accord ! Comment s'appelle ce projet ?"],
      }
      return pick(byCategory[task?.category] ?? ["Comment voulez-vous l'appeler ?", "D'accord ! Quel nom voulez-vous lui donner ?"])
    }
    const examples = {
      cours: localized(lang, 'Quel cours est-ce ? Par exemple « maths » ou « physique ».', 'Which class is it? For example, “maths” or “physics”.', 'ما الدرس؟ مثلًا «الرياضيات» أو «الفيزياء».'),
      revision: localized(lang, 'Vous révisez quelle matière ?', 'Which subject are you revising?', 'أي مادة تريد مراجعتها؟'),
      reunion: localized(lang, 'Cette réunion porte sur quel sujet ?', 'What is this meeting about?', 'ما موضوع هذا الاجتماع؟'),
      projet: localized(lang, "C'est pour quel projet ?", 'Which project is this for?', 'لأي مشروع هذا؟'),
    }
    return examples[task?.category] ?? localized(lang, "Comment voulez-vous l'appeler ?", 'What would you like to call it?', 'ماذا تريد أن تسميه؟')
  }
  if (field === 'time') {
    return languageOf(lang) === 'fr'
      ? pick(['À quelle heure souhaitez-vous le placer ?', 'Et ça se passe à quelle heure ?', "D'accord ! À quelle heure ?"])
      : localized(lang, 'À quelle heure souhaitez-vous le placer ?', 'What time would you like to schedule it?', 'في أي وقت تريد جدولته؟')
  }
  if (field === 'deadline') {
    return languageOf(lang) === 'fr'
      ? pick(['Pour quand en avez-vous besoin ?', "C'est à terminer pour quand ?", "D'accord ! Vous avez jusqu'à quand ?"])
      : localized(lang, 'Pour quand en avez-vous besoin ?', 'When do you need it by?', 'متى تحتاج إلى إنجازه؟')
  }
  return languageOf(lang) === 'fr'
    ? pick(['Vous comptez y consacrer combien de temps ?', "D'accord ! Ça va durer combien de temps ?", 'Compris. Vous en avez pour combien de temps ?'])
    : localized(lang, 'Vous comptez y consacrer combien de temps ?', 'How much time do you plan to spend on it?', 'كم من الوقت تخطط لتخصيصه؟')
}

// Quand la reponse n'est pas comprise : on repose la question avec un petit indice
export function retry(field, lang = 'fr') {
  const hint =
    field === 'title'
      ? localized(lang, 'Dites-moi simplement le nom, par exemple « maths ».', 'Just tell me its name, for example “maths”.', 'أخبرني بالاسم فقط، مثل «الرياضيات».')
      : field === 'time'
        ? localized(lang, 'Dites-moi une heure, par exemple « 10 h » ou « 14 h 30 ».', 'Tell me a time, for example “10:00” or “14:30”.', 'أخبرني بالوقت، مثل «10:00» أو «14:30».')
        : field === 'deadline'
          ? localized(lang, 'Dites-moi une date, par exemple « vendredi » ou « dans 3 jours ».', 'Tell me a date, for example “Friday” or “in 3 days”.', 'أخبرني بالتاريخ، مثل «الجمعة» أو «بعد 3 أيام».')
          : localized(lang, 'Dites-moi une durée, par exemple « 2 h » ou « 45 min ».', 'Tell me a duration, for example “2 hours” or “45 min”.', 'أخبرني بالمدة، مثل «ساعتان» أو «45 دقيقة».')
  return `${localized(lang, "Désolé, je n'ai pas bien compris.", 'Sorry, I didn’t understand.', 'عذرًا، لم أفهم.') } ${hint}`
}

// Reformulation de ce que l'assistant a compris, puis invitation a choisir un creneau
export function understood(task, clashes = [], lang = 'fr') {
  const opener = pick(
    languageOf(lang) === 'fr'
      ? ['Très bien', 'Parfait', "C'est noté", "D'accord"]
      : languageOf(lang) === 'en'
        ? ['Great', 'Perfect', 'Got it', 'All right']
        : ['حسنًا', 'ممتاز', 'تم', 'بالتأكيد'],
  )
  const name = `« ${task.title} »`
  const duration = fmtDuration(task.durationMin, lang)

  if (task.type === 'fixe' && task.start) {
    const base = localized(
      lang,
      `${opener}, ${name} le ${formatDay(task.start, lang)} à ${formatTime(task.start, lang)}, pendant ${duration}.`,
      `${opener}, ${name} on ${formatDay(task.start, lang)} at ${formatTime(task.start, lang)} for ${duration}.`,
      `${opener}، ${name} يوم ${formatDay(task.start, lang)} عند ${formatTime(task.start, lang)} لمدة ${duration}.`,
    )
    return clashes.length
      ? `${base} ${localized(lang, `Mais ça tombe en même temps que ${listClashes(clashes, lang)}. Voici des créneaux libres à la place :`, `It overlaps with ${listClashes(clashes, lang)}. Here are some free alternatives:`, `يتعارض مع ${listClashes(clashes, lang)}. إليك بعض الأوقات البديلة:`)}`
      : `${base} ${localized(lang, "Cet horaire est libre, je l'ajoute ?", 'This time is free. Shall I add it?', 'هذا الوقت متاح. هل أضيفه؟')}`
  }
  const when = task.deadline
    ? localized(lang, ` à faire avant le ${formatDay(task.deadline, lang)}`, ` due by ${formatDay(task.deadline, lang)}`, ` قبل ${formatDay(task.deadline, lang)}`)
    : ''
  return localized(
    lang,
    `${opener}, ${name} : ${duration}${when}. Voici ce que je vous propose :`,
    `${opener}, ${name}: ${duration}${when}. Here’s what I suggest:`,
    `${opener}، ${name}: ${duration}${when}. إليك ما أقترحه:`,
  )
}

export function noSlots(task, lang = 'fr') {
  if (task.type === 'fixe') return localized(lang, "Je ne trouve pas de créneau libre ce jour-là. Dites-moi un autre jour ou une autre heure.", 'I can’t find a free slot that day. Tell me another day or time.', 'لا أجد وقتًا متاحًا في ذلك اليوم. أخبرني بيوم أو وقت آخر.')
  return localized(lang, "Je ne trouve aucun créneau libre avant cette date. On peut raccourcir la durée ou repousser l'échéance : dites-moi ce qui vous arrange.", 'I can’t find a free slot before that date. We can shorten the duration or move the deadline; tell me what works for you.', 'لا أجد وقتًا متاحًا قبل هذا التاريخ. يمكننا تقصير المدة أو تأجيل الموعد النهائي؛ أخبرني بما يناسبك.')
}

export function added(task, clashes = [], lang = 'fr') {
  const phrase = pick(languageOf(lang) === 'fr' ? ["C'est fait", 'Parfait', 'Ajouté'] : languageOf(lang) === 'en' ? ['Done', 'Perfect', 'Added'] : ['تم', 'ممتاز', 'أُضيف'])
  const punctuation = localized(lang, ' ! ', '! ', ' ')
  const done = `${phrase}${punctuation}« ${task.title} » ${localized(lang, 'est dans votre planning.', 'is in your schedule.', 'أُضيف إلى جدولك.')}`
  return clashes.length ? `${done} ${localized(lang, `Attention, ça chevauche ${listClashes(clashes, lang)}.`, `Note: it overlaps with ${listClashes(clashes, lang)}.`, `تنبيه: يتعارض مع ${listClashes(clashes, lang)}.`)}` : done
}

export const conflict = (clashes, lang = 'fr') =>
  localized(lang, `Attention, ça tombe en même temps que ${listClashes(clashes, lang)}. Que préférez-vous ?`, `This overlaps with ${listClashes(clashes, lang)}. What would you prefer?`, `تنبيه: يتعارض مع ${listClashes(clashes, lang)}. ماذا تفضل؟`)

export const failed = (errors, lang = 'fr') =>
  `${localized(lang, "Je n'ai pas réussi à l'ajouter :", 'I couldn’t complete the operation:', 'تعذر إكمال العملية:')} ${Object.values(errors).join(' ')}`

export const refusedAll = (lang = 'fr') =>
  pick(languageOf(lang) === 'fr'
    ? ["Pas de souci. Dites-moi simplement quand ça vous arrange.", "D'accord. Quand est-ce que ça vous irait mieux ?"]
    : languageOf(lang) === 'en'
      ? ['No problem. Just tell me when works for you.', 'All right. What time would suit you better?']
      : ['لا بأس. أخبرني بالوقت الذي يناسبك.', 'حسنًا. ما الوقت الأنسب لك؟'])

export const conflictEdit = (lang = 'fr') =>
  localized(lang, "D'accord. Choisissez un autre créneau, ou changez l'heure avec « Modifier ».", 'All right. Choose another slot, or change the time using “Modifier”.', 'حسنًا. اختر وقتًا آخر أو غيّر الموعد باستخدام « Modifier ».')

export const conflictPropose = (count, lang = 'fr') =>
  count
    ? localized(lang, 'Voilà des créneaux libres.', 'Here are some free slots.', 'إليك بعض الأوقات المتاحة.')
    : localized(lang, "Je ne trouve pas de créneau libre pour l'instant.", 'I can’t find a free slot right now.', 'لا أجد وقتًا متاحًا الآن.')

export const unclear = (lang = 'fr') =>
  pick(languageOf(lang) === 'fr'
    ? ["Je n'ai pas bien compris. Dites-moi ce que vous avez à faire, avec la durée ou la date si vous les connaissez.", "Hmm, je n'ai pas saisi. Pouvez-vous reformuler ? Dites-moi ce que vous avez à faire et pour quand."]
    : languageOf(lang) === 'en'
      ? ['I didn’t quite understand. Tell me what you need to do, and include a duration or date if you know it.', 'Could you rephrase that? Tell me what you need to do and when.']
      : ['لم أفهم تمامًا. أخبرني بما تريد إنجازه، مع المدة أو التاريخ إن كنت تعرفهما.', 'هل يمكنك إعادة صياغة ذلك؟ أخبرني بما تريد إنجازه ومتى.'])

export const help = (lang = 'fr') =>
  localized(
    lang,
    'Je peux vous aider à planifier : une tâche (« Réviser les réseaux »), une plage horaire (« Réunion de 14 h à 15 h »), une question (« Suis-je libre jeudi ? »), une modification (« Décale le cours ») ou un objectif (« Préparer mon examen »).',
    'I can help you plan: a task (“Review networks”), a time slot (“Meeting from 14:00 to 15:00”), a question (“Am I free Thursday?”), a change (“Move my class”) or a goal (“Prepare for my exam”).',
    'يمكنني مساعدتك في التخطيط: مهمة («مراجعة الشبكات»)، فترة زمنية («اجتماع من 14:00 إلى 15:00»)، سؤال («هل أنا متاح يوم الخميس؟»)، تعديل («غيّر موعد الدرس») أو هدف («الاستعداد لامتحاني»).',
  )

export const soon = (lang = 'fr') =>
  localized(lang, "Je ne sais pas encore faire ça, mais ça arrive bientôt ! Pour l'instant, je peux ajouter une activité et trouver un créneau libre.", 'I can’t do that just yet. For now, I can add an activity and find a free slot.', 'لا أستطيع فعل ذلك بعد. يمكنني حاليًا إضافة نشاط والعثور على وقت متاح.')

// Reponses a "oui" / "non"
export const whichSlot = (lang = 'fr') =>
  pick(languageOf(lang) === 'fr'
    ? ['Plusieurs créneaux sont possibles. Lequel préférez-vous ? Cliquez sur « Accepter » à côté de celui qui vous convient.', "J'ai plusieurs créneaux à vous proposer : choisissez-en un avec le bouton « Accepter »."]
    : languageOf(lang) === 'en'
      ? ['Several slots are available. Which do you prefer? Click “Accepter” beside the one you want.', 'I have a few slots to suggest. Choose one with the “Accepter” button.']
      : ['تتوفر عدة أوقات. أيها تفضل؟ اضغط على « Accepter » بجانب الوقت المناسب.', 'لدي عدة أوقات مقترحة. اختر أحدها باستخدام زر « Accepter ».'])

export const declined = (lang = 'fr') =>
  pick(languageOf(lang) === 'fr'
    ? ["D'accord, je ne l'ajoute pas. Quel horaire ou quelle durée préférez-vous ?", 'Pas de souci ! Dites-moi ce que vous voulez changer (heure, jour, durée).']
    : languageOf(lang) === 'en'
      ? ['All right, I won’t add it. What time or duration would you prefer?', 'No problem! Tell me what you’d like to change (time, day, duration).']
      : ['حسنًا، لن أضيفه. ما الوقت أو المدة التي تفضلها؟', 'لا بأس! أخبرني بما تريد تغييره (الوقت أو اليوم أو المدة).'])

export const useButtons = (lang = 'fr') =>
  pick(languageOf(lang) === 'fr'
    ? ["Choisissez avec les boutons juste au-dessus : modifier l'horaire, proposer un créneau ou ajouter quand même.", 'Utilisez les boutons ci-dessus, ou dites-moi un autre horaire.']
    : languageOf(lang) === 'en'
      ? ['Use the buttons above to change the time, suggest another slot, or add it anyway.', 'Use the buttons above, or tell me another time.']
      : ['استخدم الأزرار أعلاه لتغيير الوقت أو اقتراح وقت آخر أو إضافته رغم ذلك.', 'استخدم الأزرار أعلاه أو أخبرني بوقت آخر.'])
// ---------- Plusieurs taches dans une phrase ----------
const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text)

// Annonce la liste des taches reperees, puis on traite la premiere
export const multi = (pieces, lang = 'fr') =>
  [
    localized(lang, `J'ai repéré ${pieces.length} tâches :`, `I found ${pieces.length} tasks:`, `وجدت ${pieces.length} مهام:`),
    ...pieces.map((p, i) => `${i + 1}. ${capitalize(p)}`),
    localized(lang, 'On commence par la première. Dites « passe » pour sauter une tâche, ou « stop » pour arrêter la liste.', 'Let’s start with the first. Say “skip” to move on, or “stop” to end the list.', 'لنبدأ بالأولى. قل «تخطَّ» للانتقال إلى التالية أو «توقف» لإنهاء القائمة.'),
  ].join('\n')

// Annonce la tache suivante (left : nombre de taches qui restent apres celle-ci)
export const nextTask = (piece, left, lang = 'fr') =>
  left === 0
    ? localized(lang, `Dernière tâche : « ${capitalize(piece)} ».`, `Last task: “${capitalize(piece)}”.`, `المهمة الأخيرة: « ${capitalize(piece)} ».`)
    : localized(lang, `Tâche suivante : « ${capitalize(piece)} » (encore ${left} après celle-ci).`, `Next task: “${capitalize(piece)}” (${left} more after this one).`, `المهمة التالية: « ${capitalize(piece)} » (تبقى ${left} بعدها).`)

export const skipped = (lang = 'fr') =>
  pick(languageOf(lang) === 'fr'
    ? ["D'accord, je passe cette tâche.", 'Pas de souci, on laisse celle-ci.']
    : languageOf(lang) === 'en'
      ? ['All right, I’ll skip this task.', 'No problem, we’ll leave this one out.']
      : ['حسنًا، سأتجاوز هذه المهمة.', 'لا بأس، سنترك هذه المهمة.'])

export const queueStopped = (lang = 'fr') =>
  localized(lang, "D'accord, j'arrête là. Les tâches restantes ne sont pas ajoutées.", 'All right, I’ll stop here. The remaining tasks won’t be added.', 'حسنًا، سأتوقف هنا. لن تتم إضافة المهام المتبقية.')

export const pieceUnclear = (piece, lang = 'fr') =>
  localized(
    lang,
    `Je n'ai pas compris « ${capitalize(piece)} », je passe à la suite. Vous pourrez me la redonner avec une date ou une durée.`,
    `I didn’t understand “${capitalize(piece)}”, so I’ll move on. You can give it to me again with a date or duration.`,
    `لم أفهم « ${capitalize(piece)} »، لذا سأنتقل إلى التالية. يمكنك ذكرها مجددًا مع تاريخ أو مدة.`,
  )