import { initSite } from '../site.js';
import { FAQ } from '../constants.js';

initSite();

const list = document.getElementById('faq-list');
if (list) {
  list.innerHTML = FAQ.map(
    (item) => `
    <details class="faq-item">
      <summary>${item.q}</summary>
      <p class="faq-item__answer">${item.a}</p>
    </details>`
  ).join('');
}
