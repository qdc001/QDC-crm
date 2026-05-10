import { useEffect, useState } from 'react';

export type Lang = 'pt' | 'en';

const dict: Record<string, Record<Lang, string>> = {
  // Comuns
  'common.save': { pt: 'Guardar', en: 'Save' },
  'common.cancel': { pt: 'Cancelar', en: 'Cancel' },
  'common.delete': { pt: 'Eliminar', en: 'Delete' },
  'common.edit': { pt: 'Editar', en: 'Edit' },
  'common.create': { pt: 'Criar', en: 'Create' },
  'common.search': { pt: 'Pesquisar', en: 'Search' },
  'common.loading': { pt: 'A carregar...', en: 'Loading...' },
  'common.error': { pt: 'Erro', en: 'Error' },
  'common.success': { pt: 'Sucesso', en: 'Success' },
  // Login
  'login.title': { pt: 'Iniciar sessão', en: 'Sign in' },
  'login.subtitle': { pt: 'Entre na sua conta para continuar', en: 'Sign in to your account to continue' },
  'login.email': { pt: 'Email', en: 'Email' },
  'login.password': { pt: 'Palavra-passe', en: 'Password' },
  'login.forgotPassword': { pt: 'Esqueceu?', en: 'Forgot?' },
  'login.signIn': { pt: 'Entrar', en: 'Sign in' },
  'login.noAccount': { pt: 'Não tem conta?', en: "Don't have an account?" },
  'login.createAccount': { pt: 'Criar conta', en: 'Create account' },
  'login.2faPrompt': { pt: 'Insere o codigo do teu autenticador', en: 'Enter the code from your authenticator' },
  // Settings
  'settings.title': { pt: 'Definições', en: 'Settings' },
  'settings.profile': { pt: 'Perfil', en: 'Profile' },
  'settings.preferences': { pt: 'Preferencias', en: 'Preferences' },
  'settings.password': { pt: 'Password', en: 'Password' },
  'settings.workspace': { pt: 'Workspace', en: 'Workspace' },
  'settings.audit': { pt: 'Auditoria', en: 'Audit' },
  'settings.sessions': { pt: 'Sessoes', en: 'Sessions' },
  'settings.security': { pt: 'Seguranca', en: 'Security' },
  'settings.language': { pt: 'Idioma', en: 'Language' },
  'settings.theme': { pt: 'Tema', en: 'Theme' },
  'settings.themeLight': { pt: 'Claro', en: 'Light' },
  'settings.themeDark': { pt: 'Escuro', en: 'Dark' },
  'settings.notifications': { pt: 'Notificacoes', en: 'Notifications' },
  'settings.emailTemplates': { pt: 'Templates de email', en: 'Email templates' },
  // Sidebar
  'nav.dashboard': { pt: 'Dashboard', en: 'Dashboard' },
  'nav.pipeline': { pt: 'Pipeline', en: 'Pipeline' },
  'nav.leads': { pt: 'Leads', en: 'Leads' },
  'nav.contacts': { pt: 'Contactos', en: 'Contacts' },
  'nav.inbox': { pt: 'Caixa de Entrada', en: 'Inbox' },
  'nav.tasks': { pt: 'Tarefas', en: 'Tasks' },
  'nav.team': { pt: 'Equipa', en: 'Team' },
  'nav.settings': { pt: 'Definições', en: 'Settings' },
};

const LANG_KEY = 'kommo:lang';

export function getLang(): Lang {
  return (localStorage.getItem(LANG_KEY) as Lang) || 'pt';
}

export function setLang(l: Lang) {
  localStorage.setItem(LANG_KEY, l);
  window.dispatchEvent(new CustomEvent('lang-changed'));
}

export function t(key: string, lang?: Lang): string {
  const l = lang || getLang();
  return dict[key]?.[l] || dict[key]?.pt || key;
}

export function useT(): [(key: string) => string, Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>(getLang);
  useEffect(() => {
    const handler = () => setLangState(getLang());
    window.addEventListener('lang-changed', handler);
    return () => window.removeEventListener('lang-changed', handler);
  }, []);
  return [(key) => t(key, lang), lang, setLang];
}
