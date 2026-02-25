import { useNavigate } from 'react-router-dom'

const EXAMPLE = `[
  {
    "url": "https://www.iea.org/reports/nuclear-power-and-secure-energy-transitions",
    "text": "Nuclear power generates about 12 grams of CO2-equivalent per kilowatt-hour over its lifecycle, comparable to wind energy. This makes it one of the lowest-carbon sources of electricity available today."
  },
  {
    "url": "https://www.world-nuclear.org/nuclear-essentials/what-is-nuclear-waste.aspx",
    "text": "High-level waste contains long-lived radionuclides that must be isolated from the environment for hundreds of thousands of years. Safe disposal remains an unsolved problem in most countries."
  },
  {
    "url": "https://www.iaea.org/topics/nuclear-power-reactors",
    "text": "Generation IV reactor designs incorporate passive safety systems that shut down automatically without operator action or external power. Several designs are in advanced development stages."
  }
]`

export default function JsonFormatPage() {
  const navigate = useNavigate()

  return (
    <div className="h-dvh overflow-y-auto bg-gray-950">
    <div className="px-4 py-12 flex justify-center">
      <div className="w-full max-w-xl">
        <button
          onClick={() => navigate('/generate')}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors mb-6 block"
        >
          ← Back to generate
        </button>

        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">Sources JSON format</h1>
        <p className="text-gray-500 mb-8 text-sm">
          Each entry is a URL paired with raw text from that source. Claude reads the content, extracts arguments, and organises them into the tree — every node will be attributed to at least one source.
        </p>

        <div className="space-y-8">
          {/* Field reference */}
          <div>
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Fields</h2>
            <div className="rounded-lg border border-gray-800 overflow-hidden">
              {[
                { field: 'url', desc: 'The URL of the source article, paper, or page.' },
                { field: 'text', desc: 'Raw text from the source — a paragraph, excerpt, or full article. Claude derives the arguments from this content.' },
              ].map(({ field, desc }, i, arr) => (
                <div key={field} className={`flex gap-4 px-4 py-3 ${i < arr.length - 1 ? 'border-b border-gray-800' : ''}`}>
                  <code className="text-xs text-gray-300 font-mono w-12 shrink-0 pt-0.5">{field}</code>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-2">Both fields are required for every entry.</p>
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
              <li>• Each generated argument node will be linked to the source it was derived from. More sources can be added manually after the tree is created.</li>
              <li>• You can optionally set a root claim on the generate page to anchor the tree around a specific thesis.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}
