import { categoryLabel, isBoostCategory, type DmType, type DmVariant } from './creators'
import { CREATOR_PITCH_FACTS, type PitchFact } from './creatorPitchFacts'
import { hasLivePayoutRoute } from './payoutRoutes'
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

// Facts this creator may hear: hold facts never; boost-only facts only for
// Creator Boost categories.
export function usableFacts(boost: boolean): PitchFact[] {
  return CREATOR_PITCH_FACTS.filter((f) => f.status !== 'hold' && (!f.boostCategoriesOnly || boost))
}

export function buildCreatorDmPrompt(creator: CommandCreator, variant: DmVariant, dmType: DmType, previousIssues: string[]) {
  const boost = isBoostCategory(creator.content_category)
  const facts = usableFacts(boost)
  const live = facts.filter((f) => f.status === 'live')
  const atLaunch = facts.filter((f) => f.status === 'at_launch')
  const payoutLive = hasLivePayoutRoute(creator.country)

  const factLines = [
    live.length > 0
      ? `TRUE TODAY. You may state these in the present tense:\n${live.map((f) => `- ${f.fact}`).join('\n')}`
      : 'TRUE TODAY: nothing. Do not describe any feature as available now.',
    atLaunch.length > 0
      ? `COMING AT LAUNCH. Only ever say these as "we're launching with …" (or "on lance avec …" in French), never as something that exists today:\n${atLaunch.map((f) => `- ${f.fact}`).join('\n')}`
      : '',
  ].filter(Boolean)

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

PRODUCT FACTS. Use ONLY these. They override anything else you know about Zuva (including revenue splits, multipliers or CPM claims elsewhere in your instructions). You do not have to use every fact; pick what fits the message.
${factLines.join('\n\n')}

HARD RULES
- Reference what this creator actually makes, using the details above. Do not invent specific videos, titles or numbers about them.
- No links, URLs, handles to visit, attachments, or mention of a deck or pitch document.
- Never mention a guaranteed payout, any earnings figure, money amount, percentage, rate, multiplier, view threshold or launch date.
- ${payoutLive ? 'Do not discuss payouts or cashing out.' : 'Never say or imply they can cash out, withdraw or receive payouts today. Payouts are not live in their country yet, so do not bring payouts up at all.'}
- ${boost ? 'You may mention Creator Boost only as described above, with no multiplier or threshold.' : 'Do not mention Creator Boost. Their category does not qualify.'}
- No hashtags. At most one emoji, and only if it fits the voice.
- Output ONLY the message text: no preamble, no quotation marks, no subject line, no sign-off name placeholder.${
    previousIssues.length > 0
      ? `\n\nYOUR PREVIOUS DRAFT BROKE THESE RULES. Fix them:\n${previousIssues.map((i) => `- ${i}`).join('\n')}`
      : ''
  }`
}

const LAUNCH_FRAMING = /launch|lan(c|ç)(e|ement|ons|er)/i

// Code-level check of the rules the prompt asks for, so a bad draft is
// regenerated (once) or flagged rather than shown as if it were fine.
export function dmRuleViolations(
  text: string,
  dmType: DmType,
  ctx: { boost: boolean; payoutLive: boolean }
): string[] {
  const issues: string[] = []
  const usable = usableFacts(ctx.boost)

  if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(com|tv|io|co|net|org)\b/i.test(text)) issues.push('Contains a link or web address')
  if (/\bdeck\b|pitch (deck|doc)|\battach/i.test(text)) issues.push('Mentions a deck or attachment')
  if (/[$€£₦¢]|\b(usd|naira|cedis|dollars?|pounds?|euros?)\b/i.test(text)) issues.push('Mentions money or a currency')
  if (/guarantee|garanti/i.test(text)) issues.push('Mentions a guarantee')
  if (/\b\d+(\.\d+)?\s*x\b/i.test(text)) issues.push('Mentions a multiplier')
  if (!ctx.payoutLive && /cash(ing)?[ -]?out|withdraw|payouts?\b|paid out|retrait|retirer|virement/i.test(text)) {
    issues.push('Brings up cashing out or payouts, which are not live for this creator')
  }

  // Facts the creator must not hear: hold facts, and boost-only facts
  // for a category that doesn't qualify.
  for (const fact of CREATOR_PITCH_FACTS) {
    if (usable.includes(fact)) continue
    if (fact.mentionPatterns?.some((re) => re.test(text))) {
      issues.push(
        fact.status === 'hold'
          ? `Mentions "${fact.label}", which is on hold`
          : `Mentions "${fact.label}" for a creator it doesn't apply to`
      )
    }
  }
  // At-launch facts must be framed as launching, not as available now.
  for (const fact of usable.filter((f) => f.status === 'at_launch')) {
    if (fact.mentionPatterns?.some((re) => re.test(text)) && !LAUNCH_FRAMING.test(text)) {
      issues.push(`Presents "${fact.label}" as available today; it is only coming at launch`)
    }
  }

  let stripped = text
  for (const figure of usable.flatMap((f) => f.allowedFigures ?? [])) stripped = stripped.split(figure).join('')
  const numbers = stripped.match(/\d[\d,.]*/g)
  if (numbers) issues.push(`Contains figures that aren't approved pitch facts (${numbers.join(', ')})`)

  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0).length
  if (sentences > MAX_SENTENCES[dmType]) issues.push(`Too long: ${sentences} sentences (max ${MAX_SENTENCES[dmType]})`)
  return issues
}
