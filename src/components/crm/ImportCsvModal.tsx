'use client'

import ImportCsvDialog from '@/components/ImportCsvDialog'
import { parseProspectCsv } from '@/lib/prospectCsv'

function previewProspects(csvText: string): string {
  const rows = parseProspectCsv(csvText)
  const missingEmail = rows.filter((r) => !r.email).length
  const missingCompany = rows.filter((r) => !r.company).length
  return `${rows.length} ${rows.length === 1 ? 'row' : 'rows'} found, ${missingEmail} missing email${
    missingCompany > 0 ? `, ${missingCompany} missing company (will be skipped)` : ''
  }`
}

export default function ImportCsvModal({ onImported }: { onImported: () => void }) {
  return (
    <ImportCsvDialog
      title="Import Prospects from CSV"
      endpoint="/api/prospects/import"
      preview={previewProspects}
      onImported={onImported}
      formatHint={
        <>
          <p className="mb-2 text-xs" style={{ color: '#888888' }}>
            Expected format (header row optional; email can be blank):
          </p>
          <code className="block rounded-md px-3 py-2 text-xs" style={{ backgroundColor: '#111111', color: '#F37B0D', border: '1px solid #2A2A2A' }}>
            company,contact,email,industry,market,size
          </code>
        </>
      }
    />
  )
}
