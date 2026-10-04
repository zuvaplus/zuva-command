'use client'

import ImportCsvDialog from '@/components/ImportCsvDialog'
import { parseCreatorCsv } from '@/lib/creatorCsv'

function previewCreators(csvText: string): string {
  const parsed = parseCreatorCsv(csvText)
  if (!parsed.ok) return parsed.error
  const rows = parsed.rows
  const noUrl = rows.filter((r) => !r.profile_url).length
  const noName = rows.filter((r) => !r.display_name).length
  return `${rows.length} ${rows.length === 1 ? 'row' : 'rows'} found, ${noUrl} missing profile URL${
    noName > 0 ? `, ${noName} missing display name (will be skipped)` : ''
  }`
}

export default function ImportCreatorsModal({ onImported }: { onImported: () => void }) {
  return (
    <ImportCsvDialog
      title="Import Creators from CSV"
      endpoint="/api/creators/import"
      preview={previewCreators}
      onImported={onImported}
      formatHint={
        <>
          <p className="mb-2 text-xs" style={{ color: '#888888' }}>
            Header row required. Only <span style={{ color: '#F37B0D' }}>display_name</span> is mandatory; other columns are optional, in any order:
          </p>
          <code className="block break-all rounded-md px-3 py-2 text-xs leading-relaxed" style={{ backgroundColor: '#111111', color: '#F37B0D', border: '1px solid #2A2A2A' }}>
            display_name,primary_platform,profile_url,followers,avg_views,country,content_category,primary_language,audience_diaspora_pct,pain_signal,proposed_tier,source,contact_method,contact_detail,notes
          </code>
          <p className="mt-2 text-xs" style={{ color: '#888888' }}>
            Followers can be written like 25k or 1.2M. Duplicates (same profile URL, or same name + platform) are skipped. Contact detail must be an email or a +WhatsApp number; anything else is dropped.
          </p>
        </>
      }
    />
  )
}
