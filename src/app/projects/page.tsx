import { supabaseAdmin } from '@/lib/supabase'
import ProjectsClient from '@/components/projects/ProjectsClient'
import type { CommandTask } from '@/lib/types'

export const dynamic = 'force-dynamic'

async function getTasks(): Promise<CommandTask[]> {
  const { data, error } = await supabaseAdmin
    .from('command_tasks')
    .select('*')
    .order('created_at', { ascending: true })

  if (error || !data) return []
  return data
}

export default async function ProjectsPage() {
  const tasks = await getTasks()
  return <ProjectsClient initialTasks={tasks} />
}
