import {
  CONTACT_RECIPIENT,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
} from 'astro:env/server';
import nodemailer from 'nodemailer';

import type { ContactRequest } from './contact-schema';

export class MailConfigurationError extends Error {
  constructor() {
    super('The SMTP credentials are not configured.');
    this.name = 'MailConfigurationError';
  }
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;',
      })[character] ?? character,
  );
}

function getMailConfiguration() {
  const user = SMTP_USER?.trim();
  const password = SMTP_PASSWORD;
  const recipient = CONTACT_RECIPIENT.trim();

  if (!user || !password || !recipient) {
    throw new MailConfigurationError();
  }

  return { user, password, recipient };
}

export async function sendContactEmail(contact: ContactRequest): Promise<string> {
  const { user, password, recipient } = getMailConfiguration();
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    requireTLS: !SMTP_SECURE,
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    disableFileAccess: true,
    disableUrlAccess: true,
  });

  const safeName = escapeHtml(contact.name);
  const safeEmail = escapeHtml(contact.email);
  const safeDescription = escapeHtml(contact.description).replace(/\n/g, '<br />');

  const info = await transporter.sendMail({
    from: `"NK Studios Site" <${user}>`,
    to: recipient,
    replyTo: {
      name: contact.name,
      address: contact.email,
    },
    subject: `Novo contato pelo portfólio - ${contact.name}`,
    text: [
      'Uma nova mensagem foi enviada pelo portfólio NK Studios.',
      '',
      `Nome: ${contact.name}`,
      `Email: ${contact.email}`,
      '',
      'Descrição:',
      contact.description,
    ].join('\n'),
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.6;">
        <h1 style="font-size: 22px; margin: 0 0 24px;">Novo contato pelo portfólio</h1>
        <p><strong>Nome:</strong> ${safeName}</p>
        <p><strong>E-mail:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin: 24px 0 8px;"><strong>Descrição:</strong></p>
        <p style="white-space: normal;">${safeDescription}</p>
      </div>
    `,
  });

  return info.messageId;
}
