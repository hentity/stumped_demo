
// ─── Shared dummy data ────────────────────────────────────────────────────────

const CURRENT_ARG = {
  text: 'Fossil fuel subsidies already dwarf renewable investment — redirecting existing public funds is a reallocation, not new cost.',
  author: 'econ_realist',
  date: 'Feb 4, 2026',
  score: 8,
  sourceCount: 2,
  forCount: 2,
  againstCount: 3,
}

const FOR_ARGS = [
  {
    id: 1,
    text: 'Climate tipping points may be irreversible. Acting now prevents costs far exceeding any short-term transition burden.',
    score: 14, author: 'solarpunk_kai', date: 'Jan 30, 2026',
    expanded: true, forCount: 3, againstCount: 2, sourceCount: 1,
  },
  {
    id: 2,
    text: 'Energy independence reduces geopolitical vulnerability. Fossil fuel importers face perpetual exposure to price manipulation.',
    score: 5, author: 'geo_watcher', date: 'Feb 1, 2026',
    expanded: false, forCount: 0, againstCount: 1, sourceCount: 0,
  },
]

const AGAINST_ARGS = [
  {
    id: 3,
    text: 'Rapid transition disproportionately burdens low-income households. Without planning, green policy becomes regressive redistribution.',
    score: 11, author: 'fairness_first', date: 'Jan 28, 2026',
    expanded: false, forCount: 2, againstCount: 1, sourceCount: 0,
  },
  {
    id: 4,
    text: "Grid reliability depends on baseload capacity. Intermittent renewables require storage solutions that don't yet exist at commercial scale.",
    score: 6, author: 'grid_eng_2031', date: 'Feb 2, 2026',
    expanded: false, forCount: 0, againstCount: 3, sourceCount: 0,
  },
]

// ─── Shared sub-components ────────────────────────────────────────────────────

function ChevronUp() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,7 6,2 10,7" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2,1 6,6 10,1" />
    </svg>
  )
}

function BackButtonC() {
  return (
    <button className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-300 border border-gray-700 rounded-lg py-1.5 transition-colors">
      <ChevronUp />
      Back
    </button>
  )
}

function VoteRow({ score, onDelete }) {
  const scoreStr = score > 0 ? `+${score}` : String(score)
  const scoreColor = score > 0 ? 'text-white' : 'text-gray-500'
  return (
    <div className="flex items-center gap-1">
      <button className="px-2.5 py-1 rounded-md text-sm bg-white/10 text-white">↑</button>
      <span className={`text-sm font-mono font-medium px-1 ${scoreColor}`}>{scoreStr}</span>
      <button className="px-2.5 py-1 rounded-md text-sm text-gray-500">↓</button>
      <span className="flex-1" />
      {onDelete && <button className="text-xs text-gray-600 hover:text-red-400 transition-colors">Delete</button>}
    </div>
  )
}

function SubArgumentsButton({ forCount, againstCount }) {
  return (
    <button className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 border border-gray-700 rounded-md py-2 hover:bg-gray-800 hover:text-gray-300 transition-colors">
      <ChevronDown />
      Sub-arguments
      {forCount > 0 && <span className="bg-green-900/60 text-green-400 rounded px-1 font-mono">{forCount}</span>}
      {againstCount > 0 && <span className="bg-red-900/60 text-red-400 rounded px-1 font-mono">{againstCount}</span>}
    </button>
  )
}

function MetaLine({ author, date, sourceCount }) {
  return (
    <p className="text-xs text-gray-500">
      {author} · {date}
      {sourceCount > 0 && (
        <> · <button className="text-gray-400 hover:text-gray-200 transition-colors">{sourceCount} source{sourceCount > 1 ? 's' : ''} ↗</button></>
      )}
    </p>
  )
}

function ConsoleItem({ arg }) {
  const score = arg.score > 0 ? `+${arg.score}` : String(arg.score)
  const scoreColor = arg.score > 0 ? 'text-white' : 'text-gray-500'

  return (
    <div className="border-b border-gray-800">
      <div className="px-4 py-3 flex items-center gap-3">
        <span className={`flex-1 text-gray-300 text-sm ${arg.expanded ? 'leading-snug' : 'truncate'}`}>
          {arg.text}
        </span>
        <span className={`text-xs font-mono font-medium shrink-0 ${scoreColor}`}>{score}</span>
      </div>
      {arg.expanded && (
        <div className="px-4 pb-4 space-y-3">
          <MetaLine author={arg.author} date={arg.date} sourceCount={arg.sourceCount} />
          <VoteRow score={arg.score} onDelete />
          <SubArgumentsButton forCount={arg.forCount} againstCount={arg.againstCount} />
        </div>
      )}
    </div>
  )
}

function ConsolePanel({ args, isFor }) {
  const bg = isFor ? 'bg-green-950/40' : 'bg-red-950/40'
  const border = isFor ? 'border-green-900/50' : 'border-red-900/50'
  const label = isFor ? 'text-green-400' : 'text-red-400'
  const addBtn = isFor
    ? 'text-green-500 border-green-900/60 hover:bg-green-950/60'
    : 'text-red-500 border-red-900/60 hover:bg-red-950/60'
  const hasExpanded = args.some(a => a.expanded)

  return (
    <div className={`flex flex-col overflow-hidden border-t ${border}`} style={{ flexGrow: hasExpanded ? 2 : 1 }}>
      <div className={`px-4 py-2.5 ${bg} border-b ${border} flex items-center justify-between shrink-0`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold uppercase tracking-widest ${label}`}>{isFor ? 'For' : 'Against'}</span>
          <span className="text-xs text-gray-600 font-mono">{args.length}</span>
        </div>
        <button className={`flex items-center gap-1 rounded border px-2 py-1 text-xs font-medium transition-colors ${addBtn}`}>
          + Add
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {args.map(a => <ConsoleItem key={a.id} arg={a} />)}
      </div>
    </div>
  )
}

// ─── Current arg panel — bordered argument content only ───────────────────────

function CurrentArgPanel() {
  const scoreStr = CURRENT_ARG.score > 0 ? `+${CURRENT_ARG.score}` : String(CURRENT_ARG.score)
  const scoreColor = CURRENT_ARG.score > 0 ? 'text-white' : 'text-gray-500'
  return (
    <div className="shrink-0 bg-gray-900 px-4 pt-3 pb-4 space-y-3">
      <BackButtonC />
      <div className="flex items-center gap-3">
        <p className="flex-1 text-white text-sm leading-snug">{CURRENT_ARG.text}</p>
        <span className={`text-xs font-mono font-medium shrink-0 ${scoreColor}`}>{scoreStr}</span>
      </div>
      <MetaLine author={CURRENT_ARG.author} date={CURRENT_ARG.date} sourceCount={CURRENT_ARG.sourceCount} />
      <VoteRow score={CURRENT_ARG.score} onDelete />
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function DesignMockups() {
  return (
    <div className="h-dvh flex flex-col bg-gray-950 overflow-hidden">
      <CurrentArgPanel />
      <ConsolePanel args={FOR_ARGS} isFor={true} />
      <ConsolePanel args={AGAINST_ARGS} isFor={false} />
    </div>
  )
}
