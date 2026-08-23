'use client'

import { useState } from 'react'
import { Mail, X } from 'lucide-react'
import EmailComposer, { type ComposerProspectData } from '@/components/crm/EmailComposer'

interface Contact {
  name: string
  role: string
  org: string
  email: string
  note: string
  highPriority?: boolean
}

const CONTACTS: Contact[] = [
  { name: 'Tim Middleton', role: 'ATS Executive Director', org: 'atszim.org', email: 'info@atszim.org', note: 'Not Contacted' },
  { name: 'Nqobile Magwizi', role: 'ZIFA President (runs Tatu Advertising)', org: 'ZIFA', email: 'info@zifa.co.zw', note: 'HIGHEST PRIORITY', highPriority: true },
  { name: 'ZTN Prime', role: 'Programming Director', org: 'ZTN', email: 'info@ztn.co.zw', note: 'PSL diaspora sub-licensing' },
  { name: 'Adesa Production Ltd', role: 'Ghana PL rights holder', org: 'Adesa Production', email: 'contact@adesaproduction.com', note: 'New deal 2025-26' },
]

export default function KeyContacts({ gmailConnected }: { gmailConnected: boolean }) {
  const [composingFor, setComposingFor] = useState<Contact | null>(null)

  const prospectData: ComposerProspectData | null = composingFor
    ? {
        company: composingFor.org,
        contact: composingFor.name,
        email: composingFor.email,
        industry: 'Sports',
        market: 'Zimbabwe / Pan-African',
        notes: `${composingFor.role}. ${composingFor.note}`,
      }
    : null

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CONTACTS.map((c) => (
        <div
          key={c.name}
          className="rounded-xl p-4"
          style={{ backgroundColor: '#1A1A1A', border: c.highPriority ? '1px solid #F37B0D' : '1px solid #2A2A2A' }}
        >
          <p className="font-bold text-white">{c.name}</p>
          <p className="text-xs" style={{ color: '#888888' }}>{c.role}</p>
          <p className="mt-1 text-xs" style={{ color: '#888888' }}>{c.email}</p>
          <p className="mt-1.5 text-xs font-semibold" style={{ color: c.highPriority ? '#F37B0D' : '#888888' }}>{c.note}</p>
          <button
            onClick={() => setComposingFor(c)}
            className="mt-3 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold text-black"
            style={{ backgroundColor: '#F37B0D' }}
          >
            <Mail size={12} />
            Send Outreach Email
          </button>
        </div>
      ))}

      {composingFor && prospectData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setComposingFor(null)}>
          <div
            className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl p-6"
            style={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Outreach — {composingFor.name}</h2>
              <button onClick={() => setComposingFor(null)} className="text-[#888888] hover:text-white"><X size={18} /></button>
            </div>
            <EmailComposer prospectId={null} prospectData={prospectData} gmailConnected={gmailConnected} />
          </div>
        </div>
      )}
    </div>
  )
}
