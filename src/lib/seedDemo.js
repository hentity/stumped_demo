import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Fixed IDs — idempotent, safe to run multiple times
export const DEMO_TREE_ID = 'demo1'
export const DEMO_ROOT_ID = 'demo1-r'

const DEMO_USER = 'demo_user'

const ARGS = [
  // ── Level 1: root ────────────────────────────────────────────────────────────
  {
    id: 'demo1-r',
    treeId: 'demo1',
    parentId: null,
    parentRelation: null,
    text: 'The global transition to renewable energy should be accelerated even at significant economic cost to developed nations.',
    score: 0,
    forCount: 2,
    againstCount: 2,
    authorDeviceId: DEMO_USER,
    authorUsername: 'demo_user',
  },

  // ── Level 2: FOR the root ─────────────────────────────────────────────────
  {
    id: 'demo1-f1',
    treeId: 'demo1',
    parentId: 'demo1-r',
    parentRelation: 'for',
    text: 'Climate tipping points may be irreversible. Acting now prevents costs far exceeding any short-term transition burden.',
    score: 14,
    forCount: 2,
    againstCount: 1,
    authorDeviceId: DEMO_USER,
    authorUsername: 'solarpunk_kai',
  },
  {
    id: 'demo1-f2',
    treeId: 'demo1',
    parentId: 'demo1-r',
    parentRelation: 'for',
    text: 'Energy independence reduces geopolitical vulnerability. Fossil fuel importers face perpetual exposure to price manipulation.',
    score: 5,
    forCount: 0,
    againstCount: 1,
    authorDeviceId: DEMO_USER,
    authorUsername: 'geo_watcher',
  },

  // ── Level 2: AGAINST the root ─────────────────────────────────────────────
  {
    id: 'demo1-a1',
    treeId: 'demo1',
    parentId: 'demo1-r',
    parentRelation: 'against',
    text: 'Rapid transition disproportionately burdens low-income households. Without careful planning, green policy becomes regressive redistribution.',
    score: 11,
    forCount: 1,
    againstCount: 1,
    authorDeviceId: DEMO_USER,
    authorUsername: 'fairness_first',
  },
  {
    id: 'demo1-a2',
    treeId: 'demo1',
    parentId: 'demo1-r',
    parentRelation: 'against',
    text: "Grid reliability depends on baseload capacity. Intermittent renewables require storage solutions that don't yet exist at commercial scale.",
    score: 6,
    forCount: 0,
    againstCount: 1,
    authorDeviceId: DEMO_USER,
    authorUsername: 'grid_eng_2031',
  },

  // ── Level 3: children of demo1-f1 ────────────────────────────────────────
  {
    id: 'demo1-f1f1',
    treeId: 'demo1',
    parentId: 'demo1-f1',
    parentRelation: 'for',
    text: "The IPCC's 1.5°C report shows we have less than a decade to halve emissions before self-reinforcing feedback loops become unavoidable.",
    score: 8,
    forCount: 0,
    againstCount: 0,
    authorDeviceId: DEMO_USER,
    authorUsername: 'climate_sci',
  },
  {
    id: 'demo1-f1f2',
    treeId: 'demo1',
    parentId: 'demo1-f1',
    parentRelation: 'for',
    text: 'Superstorm Sandy cost New York $65 billion. Remediation at civilizational scale dwarfs any transition investment — prevention is cheaper.',
    score: 5,
    forCount: 0,
    againstCount: 0,
    authorDeviceId: DEMO_USER,
    authorUsername: 'econ_realist',
  },
  {
    id: 'demo1-f1a1',
    treeId: 'demo1',
    parentId: 'demo1-f1',
    parentRelation: 'against',
    text: 'Tipping point timelines are contested even within climate science. Policy built on worst-case outliers risks misallocating trillions in the near term.',
    score: 4,
    forCount: 0,
    againstCount: 0,
    authorDeviceId: DEMO_USER,
    authorUsername: 'policy_skeptic',
  },

  // ── Level 3: children of demo1-a1 ────────────────────────────────────────
  {
    id: 'demo1-a1f1',
    treeId: 'demo1',
    parentId: 'demo1-a1',
    parentRelation: 'for',
    text: "France's carbon dividend — returning revenue directly to households — reduced inequality while cutting emissions. Equitable transition is proven possible.",
    score: 7,
    forCount: 0,
    againstCount: 0,
    authorDeviceId: DEMO_USER,
    authorUsername: 'policy_lab',
  },
  {
    id: 'demo1-a1a1',
    treeId: 'demo1',
    parentId: 'demo1-a1',
    parentRelation: 'against',
    text: 'Fossil fuel subsidies already redistribute wealth — upward, to car owners and industry. The status quo is the regressive policy.',
    score: 9,
    forCount: 0,
    againstCount: 0,
    authorDeviceId: DEMO_USER,
    authorUsername: 'subsidy_tracker',
  },
]

export async function seedDemo() {
  // Write tree doc
  await setDoc(doc(db, 'trees', 'demo1'), {
    rootArgumentId: 'demo1-r',
    createdAt: serverTimestamp(),
  })

  // Write all argument docs in parallel
  await Promise.all(
    ARGS.map(({ id, ...data }) =>
      setDoc(doc(db, 'arguments', id), {
        ...data,
        createdAt: serverTimestamp(),
      })
    )
  )
}
