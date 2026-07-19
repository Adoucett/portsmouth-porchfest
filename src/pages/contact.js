import { initSite } from '../site.js';
import { FESTIVAL } from '../constants.js';

initSite();

const emailRow = document.querySelector('[data-festival-link="email-link"]');
if (emailRow) emailRow.href = `mailto:${FESTIVAL.email}`;
