import { initSite } from '../site.js';
import { initCountdown } from '../countdown.js';
import { ABOUT } from '../constants.js';

initSite();
initCountdown(document.getElementById('countdown'));

const setText = (id, text) => {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
};
setText('what-we-are', ABOUT.whatWeAre);
setText('mission', ABOUT.mission);
setText('vision', ABOUT.vision);
