import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MARK = {
  en: 'Recommended',
  es: 'Recomendado',
  pt: 'Recomendado',
  fr: 'Recommandé',
};

const COPY = {
  en: {
    intro: 'Answer one question at a time. The highlighted option is a suggestion until you confirm it.',
    language: 'Which language do you speak?',
    otherAsk: 'Which language? > ',
    otherFallback: 'That language has no translated menu. The rest of the questions stay in English.',
    tools: 'Which tools do you use to code here? Select every one you use.',
    kind: 'What are you building?',
    kinds: {
      software: 'App or web',
      operations: 'Operations',
      research: 'Research',
      content: 'Content',
      mixed: 'A mix',
    },
    scope: 'How big is the software work right now?',
    scopes: { small: 'Small', growing: 'Growing', complex: 'Complex' },
    workflow: 'How should code changes land?',
    flows: { main: 'Straight to main', branches: 'Branches and pull requests' },
    tone: 'How should instructions be written?',
    tones: { technical: 'Technical', 'non-technical': 'With analogies', mixed: 'A mix' },
    goal: 'In one sentence, what is this project for?',
    goalHint: 'Press Enter to accept the suggestion, or type a replacement',
    emoji: 'Emoji in replies, commits and harness messages?',
    emojiOn: 'Yes',
    emojiOff: 'No',
    cancelled: 'Cancelled — nothing was touched.',
    langs: { en: 'English', es: 'Español', pt: 'Português', fr: 'Français', other: 'Another language' },
  },
  es: {
    intro: 'Una pregunta por pantalla. La opción marcada es una sugerencia hasta que la confirmes.',
    language: '¿Qué idioma hablas?',
    otherAsk: '¿Qué idioma? > ',
    otherFallback: 'Ese idioma no tiene menú traducido. El resto sigue en inglés.',
    tools: '¿Con qué herramientas programas aquí? Marca todas las que uses.',
    kind: '¿Qué estás construyendo?',
    kinds: {
      software: 'App o web',
      operations: 'Operaciones',
      research: 'Investigación',
      content: 'Contenido',
      mixed: 'Una mezcla',
    },
    scope: '¿Qué tan grande es el trabajo de software ahora?',
    scopes: { small: 'Pequeño', growing: 'Creciendo', complex: 'Complejo' },
    workflow: '¿Cómo deben entrar los cambios de código?',
    flows: { main: 'Directo en main', branches: 'Ramas y pull requests' },
    tone: '¿Cómo deben escribirse las instrucciones?',
    tones: { technical: 'Técnico', 'non-technical': 'Con analogías', mixed: 'Una mezcla' },
    goal: 'En una frase, ¿para qué es este proyecto?',
    goalHint: 'Enter acepta la sugerencia, o escribe otra',
    emoji: '¿Emoji en respuestas, commits y mensajes del arnés?',
    emojiOn: 'Sí',
    emojiOff: 'No',
    cancelled: 'Cancelado — no se tocó nada.',
    langs: { en: 'English', es: 'Español', pt: 'Português', fr: 'Français', other: 'Otro idioma' },
  },
  pt: {
    intro: 'Uma pergunta por vez. A opção marcada é uma sugestão até você confirmar.',
    language: 'Qual idioma você fala?',
    otherAsk: 'Qual idioma? > ',
    otherFallback: 'Esse idioma não tem menu traduzido. O resto continua em inglês.',
    tools: 'Quais ferramentas você usa para programar aqui? Marque todas.',
    kind: 'O que você está construindo?',
    kinds: {
      software: 'App ou web',
      operations: 'Operações',
      research: 'Pesquisa',
      content: 'Conteúdo',
      mixed: 'Uma mistura',
    },
    scope: 'Qual o tamanho do trabalho de software agora?',
    scopes: { small: 'Pequeno', growing: 'Crescendo', complex: 'Complexo' },
    workflow: 'Como as mudanças de código devem entrar?',
    flows: { main: 'Direto na main', branches: 'Branches e pull requests' },
    tone: 'Como as instruções devem ser escritas?',
    tones: { technical: 'Técnico', 'non-technical': 'Com analogias', mixed: 'Uma mistura' },
    goal: 'Em uma frase, para que serve este projeto?',
    goalHint: 'Enter aceita a sugestão, ou escreva outra',
    emoji: 'Emoji em respostas, commits e mensagens do harness?',
    emojiOn: 'Sim',
    emojiOff: 'Não',
    cancelled: 'Cancelado — nada foi alterado.',
    langs: { en: 'English', es: 'Español', pt: 'Português', fr: 'Français', other: 'Outro idioma' },
  },
  fr: {
    intro: 'Une question à la fois. L’option marquée est une suggestion jusqu’à confirmation.',
    language: 'Quelle langue parlez-vous ?',
    otherAsk: 'Quelle langue ? > ',
    otherFallback: 'Cette langue n’a pas de menu traduit. La suite reste en anglais.',
    tools: 'Quels outils utilisez-vous pour coder ici ? Cochez tous ceux que vous utilisez.',
    kind: 'Que construisez-vous ?',
    kinds: {
      software: 'App ou web',
      operations: 'Opérations',
      research: 'Recherche',
      content: 'Contenu',
      mixed: 'Un mélange',
    },
    scope: 'Quelle est l’ampleur du travail logiciel maintenant ?',
    scopes: { small: 'Petit', growing: 'En croissance', complex: 'Complexe' },
    workflow: 'Comment les changements de code doivent-ils arriver ?',
    flows: { main: 'Directement sur main', branches: 'Branches et pull requests' },
    tone: 'Comment les instructions doivent-elles être écrites ?',
    tones: { technical: 'Technique', 'non-technical': 'Avec des analogies', mixed: 'Un mélange' },
    goal: 'En une phrase, à quoi sert ce projet ?',
    goalHint: 'Entrée accepte la suggestion, ou tapez-en une autre',
    emoji: 'Des emoji dans les réponses, les commits et les messages du harness ?',
    emojiOn: 'Oui',
    emojiOff: 'Non',
    cancelled: 'Annulé — rien n’a été modifié.',
    langs: { en: 'English', es: 'Español', pt: 'Português', fr: 'Français', other: 'Une autre langue' },
  },
};

export function recommendedLanguage(env = process.env) {
  const lang = String(env.LANG || env.LC_ALL || env.LC_MESSAGES || '').toLowerCase();
  if (lang.startsWith('es')) return 'es';
  if (lang.startsWith('pt')) return 'pt';
  if (lang.startsWith('fr')) return 'fr';
  return 'en';
}

export function interviewCopy(lang) {
  return COPY[lang] || COPY.en;
}

export function markRecommended(label, lang) {
  return `${label} — ${MARK[lang] || MARK.en}`;
}

export function recommendedProjectKind(cwd) {
  const has = (name) => existsSync(join(cwd, name));
  if (has('pubspec.yaml') || has('package.json') || has('go.mod') || has('Cargo.toml') || has('pyproject.toml') || has('requirements.txt')) {
    return 'software';
  }
  return 'mixed';
}

export function draftGoal(cwd) {
  try {
    const heading = readFileSync(join(cwd, 'README.md'), 'utf8').match(/^#\s+(.+)$/m);
    if (heading) return `Build and maintain ${heading[1].trim()}.`;
  } catch { /* no readable README */ }
  return '';
}
