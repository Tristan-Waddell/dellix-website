import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon, type IconName } from '../../components/Icon.tsx'
import { dashboard, tasks, ApiError } from '../api.ts'
import {
  DEAL_STAGES,
  TASK_PRIORITIES,
  type DashboardActivity,
  type DashboardData,
  type DealStage,
  type Task,
  type TaskPriority,
} from '../../../shared/types.ts'

const stageLabels: Record<DealStage, string> = {
  lead: 'Lead',
  contacted: 'Contacted',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
}

const stageColors: Record<DealStage, string> = {
  lead: 'bg-steel-500',
  contacted: 'bg-steel-400',
  proposal: 'bg-lime-500/60',
  won: 'bg-lime-500',
  lost: 'bg-red-400/70',
}

const priorityLabels: Record<TaskPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  })
}

function formatRelativeTime(timestamp: string) {
  const elapsedMinutes = Math.round((new Date(timestamp).getTime() - Date.now()) / 60_000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (Math.abs(elapsedMinutes) < 60) return formatter.format(elapsedMinutes, 'minute')
  const elapsedHours = Math.round(elapsedMinutes / 60)
  if (Math.abs(elapsedHours) < 24) return formatter.format(elapsedHours, 'hour')
  const elapsedDays = Math.round(elapsedHours / 24)
  if (Math.abs(elapsedDays) < 7) return formatter.format(elapsedDays, 'day')
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDueDate(date: string) {
  const due = new Date(`${date}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (days < 0) return { label: 'Overdue', urgent: true }
  if (days === 0) return { label: 'Today', urgent: true }
  if (days === 1) return { label: 'Tomorrow', urgent: false }
  return {
    label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    urgent: false,
  }
}

const priorityRank: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 }

function sortTasks(list: Task[]) {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed)
    if (priorityRank[a.priority] !== priorityRank[b.priority]) return priorityRank[a.priority] - priorityRank[b.priority]
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
    if (a.due_date) return -1
    if (b.due_date) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadError, setLoadError] = useState('')

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const response = await dashboard.get()
      setData(response.dashboard)
    } catch (error) {
      setLoadError(error instanceof ApiError ? error.message : 'Could not load the dashboard.')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function replaceTask(updated: Task) {
    setData((current) => current && {
      ...current,
      tasks: sortTasks(current.tasks.map((task) => task.id === updated.id ? updated : task)),
      recent_activity: current.recent_activity.map((activity) => (
        activity.kind === 'task' && activity.id === updated.id
          ? { ...activity, label: updated.title, detail: updated.priority }
          : activity
      )),
    })
  }

  function prependTask(created: Task) {
    setData((current) => current && {
      ...current,
      tasks: sortTasks([created, ...current.tasks]),
      recent_activity: [
        {
          id: created.id,
          kind: 'task' as const,
          label: created.title,
          detail: created.priority,
          occurred_at: created.created_at,
        },
        ...current.recent_activity.filter((activity) => activity.id !== created.id),
      ].slice(0, 7),
    })
  }

  function removeTask(id: string) {
    setData((current) => current && {
      ...current,
      tasks: current.tasks.filter((task) => task.id !== id),
      recent_activity: current.recent_activity.filter((activity) => !(activity.kind === 'task' && activity.id === id)),
    })
  }

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  if (loadError && !data) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="max-w-sm text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl border border-red-500/25 bg-red-500/10 text-red-400">
            <Icon name="close" className="text-xl" />
          </div>
          <h1 className="mt-4 text-lg font-semibold">Dashboard unavailable</h1>
          <p className="mt-1 text-sm text-ink-muted">{loadError}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-5 rounded-full bg-lime-500 px-4 py-2 text-sm font-semibold text-charcoal-950 hover:bg-lime-400"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 sm:gap-7">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-lime-500">Command center</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Good to see you.</h1>
        </div>
        <p className="font-mono text-xs text-ink-muted">{today}</p>
      </header>

      {data ? (
        <>
          <SummaryCards data={data} />

          <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
            <TaskPanel
              list={data.tasks}
              onCreated={prependTask}
              onUpdated={replaceTask}
              onRemoved={removeTask}
              onRefresh={load}
            />
            <div className="grid min-w-0 gap-5">
              <PipelinePanel data={data} />
              <ActivityPanel list={data.recent_activity} />
            </div>
          </div>
        </>
      ) : (
        <DashboardSkeleton />
      )}
    </div>
  )
}

function SummaryCards({ data }: { data: DashboardData }) {
  const cards: Array<{
    label: string
    value: string
    note: string
    icon: IconName
    to: string
    accent?: boolean
  }> = [
    {
      label: 'Open pipeline',
      value: formatMoney(data.summary.open_pipeline_cents),
      note: `${data.summary.active_deals} active ${data.summary.active_deals === 1 ? 'deal' : 'deals'}`,
      icon: 'dollar',
      to: '/deals',
      accent: true,
    },
    {
      label: 'Contacts',
      value: data.summary.contacts.toLocaleString(),
      note: 'People in your CRM',
      icon: 'users',
      to: '/contacts',
    },
    {
      label: 'Active clients',
      value: data.summary.active_clients.toLocaleString(),
      note: 'Current client relationships',
      icon: 'users',
      to: '/contacts?active=true',
    },
    {
      label: 'To-do',
      value: data.tasks.filter((task) => !task.completed).length.toLocaleString(),
      note: 'Open tasks',
      icon: 'check',
      to: '/',
    },
  ]

  return (
    <section aria-label="CRM summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <Link
          key={card.label}
          to={card.to}
          className={`group rounded-[var(--radius-card)] border p-4 transition-all hover:-translate-y-0.5 sm:p-5 ${
            card.accent
              ? 'border-lime-500/20 bg-lime-500/[0.06] hover:border-lime-500/35'
              : 'border-steel-700 bg-steel-900/75 hover:border-steel-600'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium text-ink-muted">{card.label}</p>
            <Icon name={card.icon} className={card.accent ? 'text-lime-500' : 'text-steel-400'} />
          </div>
          <p className="mt-3 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{card.value}</p>
          <p className="mt-1 truncate text-xs text-ink-muted">{card.note}</p>
        </Link>
      ))}
    </section>
  )
}

function TaskPanel({
  list,
  onCreated,
  onUpdated,
  onRemoved,
  onRefresh,
}: {
  list: Task[]
  onCreated: (task: Task) => void
  onUpdated: (task: Task) => void
  onRemoved: (id: string) => void
  onRefresh: () => Promise<void>
}) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('normal')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const openCount = list.filter((task) => !task.completed).length
  const completedCount = list.length - openCount

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const response = await tasks.create({
        title,
        priority,
        due_date: dueDate || null,
      })
      onCreated(response.task)
      setTitle('')
      setPriority('normal')
      setDueDate('')
    } catch (createError) {
      setError(createError instanceof ApiError ? createError.message : 'Could not add task.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggle(task: Task) {
    const optimistic = { ...task, completed: !task.completed }
    onUpdated(optimistic)
    try {
      const response = await tasks.update(task.id, { completed: optimistic.completed })
      onUpdated(response.task)
    } catch {
      onUpdated(task)
      setError('Could not update that task.')
    }
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete “${task.title}”?`)) return
    onRemoved(task.id)
    try {
      await tasks.remove(task.id)
    } catch {
      setError('Could not delete that task.')
      await onRefresh()
    }
  }

  async function handleEdit(task: Task, changes: Pick<Task, 'title' | 'priority' | 'due_date'>) {
    const response = await tasks.update(task.id, changes)
    onUpdated(response.task)
  }

  return (
    <section className="-mx-4 overflow-hidden border-y border-steel-700 bg-steel-900/75 sm:mx-0 sm:rounded-[var(--radius-card)] sm:border">
      <div className="flex items-center justify-between border-b border-steel-700 px-4 py-4 sm:px-5">
        <div>
          <h2 className="font-semibold tracking-tight text-ink">To-do</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {openCount} open{completedCount > 0 ? ` · ${completedCount} done` : ''}
          </p>
        </div>
        <span className="grid h-8 min-w-8 place-items-center rounded-full bg-lime-500/10 px-2 font-mono text-xs font-semibold text-lime-500">
          {openCount}
        </span>
      </div>

      <form onSubmit={handleCreate} className="border-b border-steel-700/80 bg-charcoal-850/50 p-4">
        <div className="flex gap-2">
          <label htmlFor="new-task" className="sr-only">New task</label>
          <input
            id="new-task"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs doing?"
            className="h-11 min-w-0 flex-1 rounded-lg border border-steel-700 bg-charcoal-900 px-3.5 text-base text-ink placeholder:text-steel-500 focus:border-lime-500/60 focus:outline-none sm:text-sm"
          />
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            aria-label="Add task"
            className="grid h-11 w-11 shrink-0 touch-manipulation place-items-center rounded-lg bg-lime-500 text-charcoal-950 transition-colors hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="plus" className="text-lg" />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 xs:grid-cols-2">
          <label>
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-ink-muted">Priority</span>
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className="h-11 w-full appearance-none rounded-lg border border-steel-700 bg-charcoal-900 px-3 text-sm text-ink focus:border-lime-500/60 focus:outline-none sm:h-9 sm:text-xs"
            >
              {TASK_PRIORITIES.map((value) => (
                <option key={value} value={value}>{priorityLabels[value]} priority</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-ink-muted">Due date</span>
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className="h-11 w-full rounded-lg border border-steel-700 bg-charcoal-900 px-3 text-sm text-ink focus:border-lime-500/60 focus:outline-none sm:h-9 sm:text-xs"
            />
          </label>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </form>

      <div className="sm:max-h-[32rem] sm:overflow-y-auto">
        {list.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-steel-700 bg-steel-800 text-steel-400">
              <Icon name="check" />
            </div>
            <p className="mt-3 text-sm font-medium text-ink">Clear slate</p>
            <p className="mt-1 text-xs text-ink-muted">Add your first task above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-steel-700/70">
            {list.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task
  onToggle: (task: Task) => void
  onEdit: (task: Task, changes: Pick<Task, 'title' | 'priority' | 'due_date'>) => Promise<void>
  onDelete: (task: Task) => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [priority, setPriority] = useState<TaskPriority>(task.priority)
  const [dueDate, setDueDate] = useState(task.due_date ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const due = task.due_date ? formatDueDate(task.due_date) : null

  function startEditing() {
    setTitle(task.title)
    setPriority(task.priority)
    setDueDate(task.due_date ?? '')
    setError('')
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Task title cannot be empty.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await onEdit(task, {
        title: trimmedTitle,
        priority,
        due_date: dueDate || null,
      })
      setEditing(false)
    } catch (saveError) {
      setError(saveError instanceof ApiError ? saveError.message : 'Could not save task.')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <li className="bg-steel-800/25 px-4 py-4 sm:px-5">
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <label>
            <span className="sr-only">Task title</span>
            <input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') cancelEditing()
              }}
              className="h-11 w-full rounded-lg border border-steel-600 bg-charcoal-900 px-3.5 text-base text-ink placeholder:text-steel-500 focus:border-lime-500/60 focus:outline-none sm:text-sm"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 xs:gap-2">
            <label>
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-ink-muted">Priority</span>
              <select
                value={priority}
                onChange={(event) => setPriority(event.target.value as TaskPriority)}
                className="h-11 w-full appearance-none rounded-lg border border-steel-700 bg-charcoal-900 px-3 text-sm text-ink focus:border-lime-500/60 focus:outline-none sm:h-9 sm:text-xs"
              >
                {TASK_PRIORITIES.map((value) => (
                  <option key={value} value={value}>{priorityLabels[value]}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-ink-muted">Due date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-11 w-full rounded-lg border border-steel-700 bg-charcoal-900 px-3 text-sm text-ink focus:border-lime-500/60 focus:outline-none sm:h-9 sm:text-xs"
              />
            </label>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="grid grid-cols-[2.75rem_1fr_1fr] gap-2 sm:flex sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => void onDelete(task)}
              disabled={saving}
              aria-label={`Delete ${task.title}`}
              className="grid h-11 w-11 touch-manipulation place-items-center rounded-lg border border-red-500/20 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50 sm:mr-auto sm:flex sm:h-auto sm:w-auto sm:gap-1.5 sm:border-transparent sm:px-3 sm:py-2 sm:text-xs"
            >
              <Icon name="trash" className="text-sm" />
              <span className="hidden sm:inline">Delete</span>
            </button>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="h-11 touch-manipulation rounded-lg border border-steel-700 px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-steel-700 hover:text-ink disabled:opacity-50 sm:h-auto sm:border-transparent sm:py-2 sm:text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="h-11 touch-manipulation rounded-lg bg-lime-500 px-3.5 text-sm font-semibold text-charcoal-950 transition-colors hover:bg-lime-400 disabled:opacity-50 sm:h-auto sm:py-2 sm:text-xs"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </li>
    )
  }

  return (
    <li className="group flex items-start gap-2 px-4 py-3.5 transition-colors hover:bg-steel-800/35 sm:gap-3 sm:px-5">
      <button
        type="button"
        onClick={() => void onToggle(task)}
        aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
        className={`grid h-9 w-9 shrink-0 touch-manipulation place-items-center rounded-lg border transition-colors sm:mt-0.5 sm:h-5 sm:w-5 sm:rounded-md ${
          task.completed
            ? 'border-lime-500 bg-lime-500 text-charcoal-950'
            : 'border-steel-500 text-transparent hover:border-lime-500'
        }`}
      >
        <Icon name="check" className="text-xs" />
      </button>
      <div className="min-w-0 flex-1">
        <p className={`break-words pt-1.5 text-sm leading-5 sm:pt-0 ${task.completed ? 'text-steel-400 line-through' : 'text-ink'}`}>
          {task.title}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
            task.priority === 'high'
              ? 'bg-red-500/10 text-red-400'
              : task.priority === 'normal'
                ? 'bg-lime-500/10 text-lime-500'
                : 'bg-steel-700 text-ink-muted'
          }`}>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                task.priority === 'high'
                  ? 'bg-red-400'
                  : task.priority === 'normal'
                    ? 'bg-lime-500'
                    : 'bg-steel-400'
              }`}
              aria-hidden="true"
            />
              {task.priority}
          </span>
          {due && (
            <span className={`flex items-center gap-1 text-[11px] ${due.urgent && !task.completed ? 'text-red-400' : 'text-ink-muted'}`}>
              <Icon name="calendar" className="text-xs" />
              {due.label}
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <button
          type="button"
          onClick={startEditing}
          aria-label={`Edit ${task.title}`}
          className="grid h-9 w-9 touch-manipulation place-items-center rounded-lg text-ink-muted transition-colors hover:bg-steel-700 hover:text-ink sm:h-7 sm:w-7 sm:rounded-md sm:text-steel-500"
        >
          <Icon name="edit" className="text-sm" />
        </button>
        <button
          type="button"
          onClick={() => void onDelete(task)}
          aria-label={`Delete ${task.title}`}
          className="hidden h-7 w-7 place-items-center rounded-md text-steel-500 transition-colors hover:bg-red-500/10 hover:text-red-400 sm:grid"
        >
          <Icon name="trash" className="text-sm" />
        </button>
      </div>
    </li>
  )
}

function PipelinePanel({ data }: { data: DashboardData }) {
  const stages = useMemo(() => {
    return DEAL_STAGES.map((stage) => {
      const found = data.pipeline.find((item) => item.stage === stage)
      return { stage, count: found?.count ?? 0, value_cents: found?.value_cents ?? 0 }
    })
  }, [data.pipeline])
  const maxValue = Math.max(...stages.map((item) => item.value_cents), 1)

  return (
    <section className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold tracking-tight text-ink">Pipeline</h2>
          <p className="mt-0.5 text-xs text-ink-muted">Value by stage</p>
        </div>
        <Link to="/deals" className="text-xs font-medium text-lime-500 hover:text-lime-400">View deals</Link>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {stages.map((item) => (
          <div key={item.stage}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <span className="text-ink-muted">{stageLabels[item.stage]} <span className="text-steel-500">· {item.count}</span></span>
              <span className="font-mono text-[11px] text-ink">{formatMoney(item.value_cents)}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-steel-800">
              <div
                className={`h-full rounded-full ${stageColors[item.stage]}`}
                style={{ width: item.value_cents === 0 ? '0%' : `${Math.max((item.value_cents / maxValue) * 100, 5)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ActivityPanel({ list }: { list: DashboardActivity[] }) {
  const metadata: Record<DashboardActivity['kind'], { icon: IconName; label: string; to: string | null }> = {
    contact: { icon: 'users', label: 'Contact added', to: '/contacts' },
    company: { icon: 'building', label: 'Company added', to: '/companies' },
    deal: { icon: 'pipeline', label: 'Deal created', to: '/deals' },
    task: { icon: 'check', label: 'Task added', to: null },
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75 p-4 sm:p-5">
      <div>
        <h2 className="font-semibold tracking-tight text-ink">Recent activity</h2>
        <p className="mt-0.5 text-xs text-ink-muted">Latest additions across your CRM</p>
      </div>
      {list.length === 0 ? (
        <p className="py-8 text-center text-xs text-ink-muted">Activity will appear here.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {list.map((activity) => {
            const meta = metadata[activity.kind]
            const content = (
              <>
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-steel-800 text-steel-400">
                  <Icon name={meta.icon} className="text-sm" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-ink">{activity.label}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-ink-muted">
                    {meta.label}{activity.detail ? ` · ${activity.detail}` : ''}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[10px] text-steel-500">{formatRelativeTime(activity.occurred_at)}</span>
              </>
            )
            return (
              <li key={`${activity.kind}-${activity.id}`}>
                {meta.to ? (
                  <Link to={meta.to} className="flex gap-2.5 rounded-lg px-2 py-2 hover:bg-steel-800/50">{content}</Link>
                ) : (
                  <div className="flex gap-2.5 rounded-lg px-2 py-2">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" className="animate-pulse">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75" />
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
        <div className="h-[30rem] rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75" />
        <div className="h-80 rounded-[var(--radius-card)] border border-steel-700 bg-steel-900/75" />
      </div>
    </div>
  )
}
