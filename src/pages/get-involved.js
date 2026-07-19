import { initSite } from '../site.js';
import { FESTIVAL } from '../constants.js';

initSite();

const iframe = document.getElementById('interest-form-embed');
if (iframe) {
  iframe.src = FESTIVAL.interestFormEmbed;
}
