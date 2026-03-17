/**
 * Mailchimp utilities for DataPalo
 * Shared helper for tagging contacts to trigger automations.
 */

import { createHash } from 'crypto';

/**
 * Get Mailchimp config from environment
 */
function getMailchimpConfig() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    return null;
  }

  const dataCenter = apiKey.split('-').pop();
  return { apiKey, audienceId, dataCenter };
}

/**
 * Tag an existing Mailchimp contact with one or more tags.
 * Uses the Mailchimp Tags endpoint which works for existing members.
 *
 * @param {string} email - Contact email address
 * @param {string[]} tags - Array of tag names to add (e.g., ['DataPalo PRO'])
 */
export async function tagMailchimpContact(email, tags) {
  const config = getMailchimpConfig();
  if (!config) {
    console.warn('[Mailchimp] Not configured — skipping tag');
    return;
  }

  // Mailchimp uses MD5 hash of lowercase email as subscriber ID
  const subscriberHash = createHash('md5')
    .update(email.toLowerCase())
    .digest('hex');

  const tagPayload = {
    tags: tags.map(tag => ({ name: tag, status: 'active' })),
  };

  const response = await fetch(
    `https://${config.dataCenter}.api.mailchimp.com/3.0/lists/${config.audienceId}/members/${subscriberHash}/tags`,
    {
      method: 'POST',
      headers: {
        Authorization: `apikey ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tagPayload),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Mailchimp tag failed: ${response.status} ${errorData.detail || ''}`);
  }

  console.log(`[Mailchimp] Tagged ${email} with: ${tags.join(', ')}`);
}
