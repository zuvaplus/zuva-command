import { categoryLabel, isBoostCategory, type DmType, type DmVariant } from './creators'
import type { CommandCreator } from './types'

// Prompt + rule checks for the creator DM assistant (/api/ai/creator-dm).

const VARIANT_GUIDANCE: Record<DmVariant, string> = {
  nigerian:
    'A Nigerian creator. Warm, confident and direct, the way one Nigerian creative would message another. Natural Nigerian English is fine; never force slang or pidgin.',
  zimbabwean:
    'A Zimbabwean creator. Respectful, warm and plain-spoken. A short Shona or Ndebele greeting is fine only if it reads naturally; otherwise English.',
  caribbean:
    'A Caribbean creator. Easy, friendly and direct. Do not imitate patois or dialect.',
  diaspora:
    'An African or Caribbean diaspora creator in the UK or North America. Peer-to-peer and modern; speak to building for the diaspora audience.',
  francophone:
    'A Francophone African or Caribbean creator. Write the whole message in natural, friendly French (tutoiement is fine for a DM).',
}

const TYPE_GUIDANCE: Record<DmType, string> = {
  first:
    'First message. THREE SENTENCES MAXIMUM. Open by referencing what they make, specifically. One line on Zuva. End with a simple question that is easy to reply to. The only goal is a reply.',
  follow_up:
    'Follow-up 5 days after a first message with no reply. TWO SENTENCES MAXIMUM. Light, no guilt, no "just checking in". Add one new angle and an easy question.',
  post_reply:
    'They replied to the first message. Five sentences maximum. Acknowledge their reply, answer briefly, and suggest a short call as the next step.',
}

const MAX_SENTENCES: Record<DmType, number> = { first: 3, follow_up: 2, post_reply: 5 }

export function buildCreatorDmPrompt(creator: CommandCreator, variant: DmVariant, dmType: DmType, previousIssues: string[]) {
  const boost = isBoostCategory(creator.content_category)
  const facts = [
    'Creators keep 70% of revenue: a 70/30 split in the creator\'s favour.',
    'No geographic CPM penalty: creators are not paid less per view because of where they or their audience are.',
    ...(boost
      ? [`Creator Boost: their category (${categoryLabel(creator.content_category)}) is a protected category that gets Creator Boost.`]
      : []),
  ]

  return `Write a social media DM to recruit this creator as a founding creator on Zuva.

CREATOR
Name: ${creator.display_name}
Platform: ${creator.primary_platform}
Profile: ${creator.profile_url ?? 'unknown'}
What they make (category): ${categoryLabel(creator.content_category)}
Country: ${creator.country ?? 'unknown'}
Language: ${creator.primary_language ?? 'unknown'}
Frustrated with monetization / not monetised: ${creator.pain_signal ? 'yes' : 'unknown'}
Notes about them: ${creator.notes ?? 'none'}

AUDIENCE / VOICE
${VARIANT_GUIDANCE[variant]}

MESSAGE TYPE
${TYPE_GUIDANCE[dmType]}

PRODUCT FACTS — use ONLY these. They override anything else you know about Zuva.
${facts.map((f) => `- ${f}`).join('\n')}

HARD RULES
- Reference what this creator actually makes, using the details above. Do not invent specific videos, titles or numbers about them.
- No links, URLs, handles to visit, attachments, or mention of a deck or pitch document.
- Never mention a guaranteed payout, any earnings figure, money amount, rate, multiplier, view threshold, Suns or launch date.
- ${boost ? 'You may mention Creator Boost, but give no multiplier or threshold.' : 'Do not mention Creator Boost — their category does not qualify.'}
- No hashtags. At most one emoji, and only if it fits the voice.
- Output ONLY the message text: no preamble, no quotation marks, no subject line, no sign-off name placeholder.${
    previousIssues.length > 0
      ? `\n\nYOUR PREVIOUS DRAFT BROKE THESE RULES — fix them:\n${previousIssues.map((i) => `- ${i}`).join('\n')}`
      : ''
  }`
}

// Code-level check of the rules the prompt asks for, so a bad draft is
// regenerated (once) or flagged rather than shown as if it were fine.
export function dmRuleViolations(text: string, dmType: DmType, boost: boolean): string[] {
  const issues: string[] = []
  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|tv|io|co|net|org)\b/i.test(text)) issues.push('Contains a link or web address')
  if (/\bdeck\b|pitch (deck|doc)|\battach/i.test(text)) issues.push('Mentions a deck or attachment')
  if (/[$€£₦¢]|\b(usd|naira|cedis|dollars?|pounds?|euros?)\b/i.test(text)) issues.push('Mentions money or a currency')
  if (/guarantee/i.test(text)) issues.push('Mentions a guarantee')
  if (/\b\d+(\.\d+)?\s*x\b|\b1\.5\b/i.test(text)) issues.push('Mentions a multiplier')
  if (/\bsuns?\b/i.test(text)) issues.push('Mentions Suns')
  if (!boost && /creator boost/i.test(text)) issues.push('Mentions Creator Boost for a category that does not qualify')
  const numbers = text.replace(/70\s*\/\s*30|70\s*%/g, '').match(/\d[\d,.]*/g)
  if (numbers) issues.push(`Contains figures other than the 70/30 split (${numbers.join(', ')})`)
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0).length
  if (sentences > MAX_SENTENCES[dmType]) issues.push(`Too long: ${sentences} sentences (max ${MAX_SENTENCES[dmType]})`)
  return issues
}
