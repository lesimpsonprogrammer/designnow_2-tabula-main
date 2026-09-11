import type { File, Page, Theme } from '../../types';
import { genHtml } from './html';
import { genCss } from './css';
import { APP_JS, API_PY, DEPLOY_SH, SCHEMA_SQL } from './aux';

export function buildFiles(page: Page, theme: Theme): File[] {
  return [
    { name: 'index.html', language: 'html', content: genHtml(page, theme) },
    { name: 'styles.css', language: 'css', content: genCss(theme) },
    { name: 'app.js', language: 'js', content: APP_JS },
    { name: 'api.py', language: 'py', content: API_PY },
    { name: 'deploy.sh', language: 'sh', content: DEPLOY_SH },
    { name: 'schema.sql', language: 'sql', content: SCHEMA_SQL },
  ];
}

export { genHtml, genCss };
