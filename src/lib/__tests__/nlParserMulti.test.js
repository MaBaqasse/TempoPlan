// Tests : pretraitement (fautes de frappe, anglais, arabe) et plusieurs taches dans une phrase.
// Date fixe : dimanche 22 novembre 2026, 19 h. Lundi = 23/11, mardi = 24/11, vendredi = 27/11.
import { describe, expect, it } from 'vitest'
import {
  analyzeRules,
  completeTask,
  parseAction,
  parseQuery,
  parseTaskDetailed,
  preprocess,
  queueCommand,
  splitTasks,
  yesNo,
} from '../nlParser'

const now = new Date(2026, 10, 22, 19, 0)

describe('preprocess : fautes de frappe', () => {
  it('corrige les jours et mots de date mal ecrits', () => {
    expect(preprocess('cours lnudi')).toBe('cours lundi')
    expect(preprocess('reunion vendrdi')).toBe('reunion vendredi')
    expect(preprocess('rapport dmain')).toBe('rapport demain')
    expect(preprocess('mecredi')).toBe('mercredi')
    expect(preprocess('la semain prochaine')).toBe('la semaine prochaine')
  })
  it('ne touche pas aux mots corrects, aux titres ni aux noms propres', () => {
    expect(preprocess('Cours de maths lundi')).toBe('Cours de maths lundi')
    expect(preprocess('Martin demain')).toBe('Martin demain')
    expect(preprocess('Réviser les réseaux 2 h avant vendredi')).toBe('Réviser les réseaux 2 h avant vendredi')
    expect(preprocess('domain')).toBe('domain')
  })
  it('est idempotent et accepte le vide', () => {
    const once = preprocess('Meeting tomorrow at 3pm for 2 hours')
    expect(preprocess(once)).toBe(once)
    expect(preprocess('')).toBe('')
    expect(preprocess(undefined)).toBe('')
  })
  it('la creation comprend la faute de frappe', () => {
    const { task, missing } = parseTaskDetailed('cours lnudi', now)
    expect(task._date).toBe('2026-11-23')
    expect(missing).toEqual(['time'])
  })
})

describe('preprocess : anglais', () => {
  it('jours, periodes et echeances', () => {
    expect(preprocess('tomorrow')).toBe('demain')
    expect(preprocess('day after tomorrow')).toBe('apres-demain')
    expect(preprocess('next monday')).toBe('lundi prochain')
    expect(preprocess('on friday')).toBe('vendredi')
    expect(preprocess('tomorrow morning')).toBe('demain matin')
    expect(preprocess('by friday')).toBe('avant vendredi')
    expect(preprocess('in 3 days')).toBe('dans 3 jours')
  })
  it('heures am/pm et plages', () => {
    expect(preprocess('at 3pm')).toBe('à 15h')
    expect(preprocess('at 12am')).toBe('à 0h')
    expect(preprocess('at 12pm')).toBe('à 12h')
    expect(preprocess('from 2pm to 3:30pm')).toBe('de 14h à 15h30')
  })
  it('durees', () => {
    expect(preprocess('for 2 hours')).toBe('pendant 2 h')
    expect(preprocess('1.5 hours')).toBe('1h30')
    expect(preprocess('45 mins')).toBe('45 min')
    expect(preprocess('half an hour')).toBe('30 min')
  })
  it('une phrase complete devient une activite fixe', () => {
    const { task } = parseTaskDetailed('Meeting tomorrow at 3pm for 2 hours', now)
    expect(task).toMatchObject({
      title: 'Meeting',
      category: 'reunion',
      type: 'fixe',
      start: '2026-11-23T15:00',
      durationMin: 120,
    })
  })
  it('revise networks 2 hours before friday : flexible, echeance vendredi 18 h', () => {
    const { task } = parseTaskDetailed('Revise networks 2 hours before friday', now)
    expect(task).toMatchObject({
      title: 'Revise networks',
      category: 'revision',
      type: 'flexible',
      deadline: '2026-11-27T18:00',
      durationMin: 120,
    })
  })
  it('un cours en anglais sans heure : on demande l\'heure', () => {
    const { task, missing } = parseTaskDetailed('math class next monday', now)
    expect(task.category).toBe('cours')
    expect(task._date).toBe('2026-11-23') // « lundi prochain » = le prochain lundi (comme en francais)
    expect(missing).toEqual(['time'])
  })
  it('questions, ordres et reponses', () => {
    expect(analyzeRules('what do I have tomorrow', now).intent).toBe('query')
    expect(analyzeRules('am I free thursday afternoon', now).intent).toBe('query')
    expect(analyzeRules('cancel my meeting', now).intent).toBe('modify')
    expect(analyzeRules('I finished the report', now).intent).toBe('modify')
    expect(parseQuery('what do I have tomorrow', now).label).toBe('demain')
    expect(parseAction('postpone my meeting to friday', now).action).toBe('postpone')
    expect(yesNo('sure')).toBe('yes')
  })
  it('« good morning » reste une salutation', () => {
    expect(analyzeRules('good morning', now).intent).toBe('chitchat')
  })
})

describe('preprocess : arabe', () => {
  it('jours et dates', () => {
    expect(preprocess('غدا')).toBe('demain')
    expect(preprocess('بعد غد')).toBe('apres-demain')
    expect(preprocess('اليوم')).toBe("aujourd'hui")
    expect(preprocess('الاثنين')).toBe('lundi')
    expect(preprocess('يوم الأربعاء')).toBe('mercredi')
    expect(preprocess('الجمعة القادم')).toBe('vendredi prochain')
    expect(preprocess('الأسبوع القادم')).toBe('semaine prochaine')
  })
  it('heures et durees, chiffres arabes compris', () => {
    expect(preprocess('الساعة ٣')).toBe('à 3h')
    expect(preprocess('الساعة 14:30')).toBe('à 14h30')
    expect(preprocess('ساعتين')).toBe('2 h')
    expect(preprocess('3 ساعات')).toBe('3 h')
    expect(preprocess('نصف ساعة')).toBe('30 min')
    expect(preprocess('45 دقيقة')).toBe('45 min')
  })
  it('une phrase arabe devient une activite', () => {
    const { task } = parseTaskDetailed('اجتماع غدا الساعة 14 ساعتين', now)
    expect(task).toMatchObject({ title: 'اجتماع', category: 'reunion', type: 'fixe', start: '2026-11-23T14:00', durationMin: 120 })
  })
  it('un cours en arabe sans heure : on demande l\'heure', () => {
    const { task, missing } = parseTaskDetailed('حصة الاثنين', now)
    expect(task.category).toBe('cours')
    expect(task._date).toBe('2026-11-23')
    expect(missing).toEqual(['time'])
  })
  it('la reponse a une question comprend l\'arabe', () => {
    const task = { title: 'Cours', type: 'fixe', start: null, _date: '2026-11-23', durationMin: 60 }
    expect(completeTask(task, 'time', 'الساعة 12', now).start).toBe('2026-11-23T12:00')
  })
  it('oui / non, salutations et remerciements', () => {
    expect(yesNo('نعم')).toBe('yes')
    expect(yesNo('لا')).toBe('no')
    expect(analyzeRules('مرحبا', now).intent).toBe('chitchat')
    expect(analyzeRules('شكرا', now).intent).toBe('chitchat')
  })
})

describe('splitTasks : plusieurs taches dans une phrase', () => {
  it('coupe sur « puis », « ; » et « ensuite »', () => {
    expect(splitTasks('cours lundi puis réunion mardi', now)).toEqual(['cours lundi', 'réunion mardi'])
    expect(splitTasks('cours lundi ; réviser réseaux 2 h avant vendredi', now)).toEqual([
      'cours lundi',
      'réviser réseaux 2 h avant vendredi',
    ])
    expect(splitTasks('cours lundi, ensuite tp mardi', now)).toEqual(['cours lundi', 'tp mardi'])
    expect(splitTasks("d'abord cours lundi puis tp mardi", now)).toEqual(['cours lundi', 'tp mardi'])
  })
  it('coupe sur « et » seulement si chaque morceau est une tache', () => {
    expect(splitTasks('cours lundi et réunion mardi', now)).toEqual(['cours lundi', 'réunion mardi'])
    expect(splitTasks('maths lundi et physique mardi', now)).toEqual(['maths lundi', 'physique mardi'])
  })
  it('ne coupe pas « lundi et mardi » ni « 2 h et demie »', () => {
    expect(splitTasks('cours lundi et mardi', now)).toBeNull()
    expect(splitTasks('réviser 2 h et demie lundi', now)).toBeNull()
    expect(splitTasks('réviser 1 h et quart vendredi', now)).toBeNull()
  })
  it('trois taches', () => {
    expect(splitTasks('cours lundi puis réunion mardi puis tp vendredi', now)).toHaveLength(3)
  })
  it('anglais et arabe', () => {
    expect(splitTasks('math class tomorrow then physics lab friday', now)).toEqual([
      'math class tomorrow',
      'physics lab friday',
    ])
    expect(splitTasks('اجتماع غدا ثم حصة الاثنين', now)).toHaveLength(2)
  })
  it('une seule tache, une question, un ordre ou une salutation : null', () => {
    expect(splitTasks('Réunion demain de 14 h à 15 h 30', now)).toBeNull()
    expect(splitTasks('bonjour', now)).toBeNull()
    expect(splitTasks('', now)).toBeNull()
    expect(splitTasks(undefined, now)).toBeNull()
    expect(splitTasks("j'ai quoi demain puis suis-je libre jeudi", now)).toBeNull()
    expect(splitTasks("j'ai fini le cours puis annule le tp", now)).toBeNull()
  })
  it('un morceau sans date ni duree reste dans la liste (le chat le signalera)', () => {
    expect(splitTasks('cours lundi puis réviser les réseaux', now)).toEqual(['cours lundi', 'réviser les réseaux'])
  })
  it('chaque morceau reste analysable', () => {
    for (const piece of splitTasks('cours lundi puis réviser réseaux 2 h avant vendredi', now)) {
      expect(analyzeRules(piece, now).intent).toBe('create')
    }
  })
})

describe('queueCommand', () => {
  it('passe / stop', () => {
    expect(queueCommand('passe')).toBe('skip')
    expect(queueCommand('Passe !')).toBe('skip')
    expect(queueCommand('suivante')).toBe('skip')
    expect(queueCommand('skip')).toBe('skip')
    expect(queueCommand('stop')).toBe('stop')
    expect(queueCommand('arrête')).toBe('stop')
    expect(queueCommand('annule tout')).toBe('stop')
  })
  it('le reste n\'est pas une commande', () => {
    expect(queueCommand('maths')).toBeNull()
    expect(queueCommand('passe le cours à 14 h')).toBeNull()
    expect(queueCommand('')).toBeNull()
    expect(queueCommand(undefined)).toBeNull()
  })
})

describe('non-regression : le francais ne change pas', () => {
  it('scenario « cours lundi » -> maths -> 12H -> 2H', () => {
    let { task } = parseTaskDetailed('cours lundi', now)
    task = completeTask(task, 'title', 'maths', now)
    expect(task.title).toBe('Cours de maths')
    task = completeTask(task, 'time', '12H', now)
    expect(task.start).toBe('2026-11-23T12:00')
    task = completeTask(task, 'duration', '2H', now)
    expect(task.durationMin).toBe(120)
  })
  it('plage horaire, salutations, questions', () => {
    const { task } = parseTaskDetailed('Réunion demain de 14 h à 15 h 30', now)
    expect(task).toMatchObject({ type: 'fixe', start: '2026-11-23T14:00', durationMin: 90 })
    expect(analyzeRules('bonjour', now).intent).toBe('chitchat')
    expect(analyzeRules("j'ai quoi demain ?", now).intent).toBe('query')
    expect(analyzeRules('annule le cours de maths', now).intent).toBe('modify')
    expect(yesNo('oui')).toBe('yes')
    expect(yesNo('non, 2 h')).toBeNull()
  })
})