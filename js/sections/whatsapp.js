import { esc } from '../content.js';

// WhatsApp button; omitted without a number.
export function whatsapp(ctx) {
  const digits = ctx.setting('whatsapp_number').replace(/\D/g, '');
  if (!digits) return '';
  const greeting = ctx.setting('whatsapp_greeting');
  const href = `https://wa.me/${digits}${greeting ? `?text=${encodeURIComponent(greeting)}` : ''}`;
  const label = ctx.setting('label_whatsapp_button', 'Chat with us on WhatsApp');
  return `<section class="section whatsapp" id="whatsapp"><a class="button button--whatsapp" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)}</a></section>`;
}
