import { useNavigate } from 'react-router-dom'

const EXAMPLE = `[
  {
    "argument": "Nuclear energy produces minimal CO2 during operation",
    "url": "https://www.iea.org/reports/nuclear-power-and-secure-energy-transitions",
    "quote": "Nuclear power generates about 12 grams of CO2-equivalent per kilowatt-hour over its lifecycle, comparable to wind energy."
  },
  {
    "argument": "Nuclear waste remains hazardous for thousands of years",
    "url": "https://www.world-nuclear.org/nuclear-essentials/what-is-nuclear-waste.aspx",
    "quote": "High-level waste contains long-lived radionuclides that must be isolated from the environment for hundreds of thousands of years."
  },
  {
    "argument": "Modern reactor designs have significantly improved safety",
    "url": "https://www.iaea.org/topics/nuclear-power-reactors",
    "quote": "Generation IV reactor designs incorporate passive safety systems that shut down automatically without operator action or external power."
  }
]`

export default function JsonFormatPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">
        <button
          onClick={() => navigate('/generate')}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-6 block"
        >
          ← Back to generate
        </button>

        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Sources JSON format</h1>
        <p className="text-gray-500 mb-8 text-sm">
          The sources input expects a JSON array. Each entry is a sourced claim that Claude will use to build the argument tree. Every node in the tree will be backed by at least one entry.
        </p>

        <div className="space-y-8">
          {/* Field reference */}
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Fields</h2>
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              {[
                { field: 'argument', desc: 'The claim or position this source supports. Claude uses this to place the entry in the tree.' },
                { field: 'url', desc: 'The URL of the source article, paper, or page.' },
                { field: 'quote', desc: 'The specific excerpt from the source that backs the argument.' },
              ].map(({ field, desc }, i, arr) => (
                <div key={field} className={`flex gap-4 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-800' : ''}`}>
                  <code className="text-xs text-gray-300 font-mono w-20 shrink-0 pt-0.5">{field}</code>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">All three fields are required for every entry.</p>
          </div>

          {/* Example */}
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Example</h2>
            <pre className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">
              {EXAMPLE}
            </pre>
          </div>

          {/* Notes */}
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Notes</h2>
            <ul className="space-y-2 text-xs text-gray-500">
              <li>• You can include any number of entries — the more you provide, the richer the tree.</li>
              <li>• Entries don't need to be pre-organised into for/against groups — Claude infers the structure.</li>
              <li>• Each generated tree node will be linked to the source entry it was derived from. Additional sources can be added manually after the tree is created.</li>
              <li>• You can optionally set a root claim on the generate page to anchor the tree around a specific thesis.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
