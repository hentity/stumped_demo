import { doc, setDoc, deleteDoc, getDocs, collection, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

export const DEMO_TREE_ID = 'demo1'
export const DEMO_ROOT_ID = 'demo1-r'

const U = 'demo_user'

const ARGS = [
  // ── Level 1: root ─────────────────────────────────────────────────────────────
  {
    id: 'demo1-r',
    treeId: 'demo1', parentId: null, parentRelation: null,
    text: 'The global transition to renewable energy should be accelerated even at significant economic cost to developed nations.',
    score: 0, forCount: 4, againstCount: 4,
    authorDeviceId: U, authorUsername: 'stumped_admin',
  },

  // ── Level 2: FOR ──────────────────────────────────────────────────────────────
  {
    id: 'demo1-f1',
    treeId: 'demo1', parentId: 'demo1-r', parentRelation: 'for',
    text: 'Climate tipping points may be irreversible. Acting now prevents costs far exceeding any short-term transition burden.',
    score: 14, forCount: 2, againstCount: 1,
    authorDeviceId: U, authorUsername: 'solarpunk_kai',
  },
  {
    id: 'demo1-f2',
    treeId: 'demo1', parentId: 'demo1-r', parentRelation: 'for',
    text: 'Energy independence reduces geopolitical vulnerability. Fossil fuel importers face perpetual exposure to price manipulation and supply cutoffs.',
    score: 5, forCount: 1, againstCount: 1,
    authorDeviceId: U, authorUsername: 'geo_watcher',
  },
  {
    id: 'demo1-f3',
    treeId: 'demo1', parentId: 'demo1-r', parentRelation: 'for',
    text: 'The green transition is the largest economic opportunity of the century. Nations that lead it capture manufacturing bases and export markets for decades.',
    score: 9, forCount: 1, againstCount: 1,
    authorDeviceId: U, authorUsername: 'industrialist_42',
  },
  {
    id: 'demo1-f4',
    treeId: 'demo1', parentId: 'demo1-r', parentRelation: 'for',
    text: 'Developed nations built their wealth burning fossil fuels whose emissions the global south will suffer most. Accelerated transition is basic reparative justice.',
    score: 3, forCount: 0, againstCount: 1,
    authorDeviceId: U, authorUsername: 'global_equity',
  },

  // ── Level 2: AGAINST ──────────────────────────────────────────────────────────
  {
    id: 'demo1-a1',
    treeId: 'demo1', parentId: 'demo1-r', parentRelation: 'against',
    text: 'Rapid transition disproportionately burdens low-income households through higher energy costs. Without careful design, green policy becomes regressive redistribution.',
    score: 11, forCount: 1, againstCount: 1,
    authorDeviceId: U, authorUsername: 'fairness_first',
  },
  {
    id: 'demo1-a2',
    treeId: 'demo1', parentId: 'demo1-r', parentRelation: 'against',
    text: "Grid reliability requires baseload capacity. Intermittent renewables need storage solutions that don't yet exist at scale — blackouts during the transition are a real risk.",
    score: 6, forCount: 1, againstCount: 1,
    authorDeviceId: U, authorUsername: 'grid_eng_2031',
  },
  {
    id: 'demo1-a3',
    treeId: 'demo1', parentId: 'demo1-r', parentRelation: 'against',
    text: "Forcing expensive renewables on developing nations denies them the cheap energy that powered Western industrialization. It's ladder-kicking dressed as environmentalism.",
    score: 8, forCount: 1, againstCount: 1,
    authorDeviceId: U, authorUsername: 'dev_economist',
  },
  {
    id: 'demo1-a4',
    treeId: 'demo1', parentId: 'demo1-r', parentRelation: 'against',
    text: 'Markets already price carbon risk and renewables are falling in cost without mandates. Politically-driven acceleration distorts investment and wastes capital on premature technology.',
    score: 2, forCount: 0, againstCount: 1,
    authorDeviceId: U, authorUsername: 'free_market_fred',
  },

  // ── Level 3: children of demo1-f1 (tipping points) ───────────────────────────
  {
    id: 'demo1-f1f1',
    treeId: 'demo1', parentId: 'demo1-f1', parentRelation: 'for',
    text: "The IPCC's 1.5°C report shows we have less than a decade to halve emissions before self-reinforcing feedback loops — melting permafrost, ice-albedo collapse — become unavoidable.",
    score: 8, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'climate_sci',
  },
  {
    id: 'demo1-f1f2',
    treeId: 'demo1', parentId: 'demo1-f1', parentRelation: 'for',
    text: 'Superstorm Sandy cost New York $65 billion. Remediation at civilizational scale dwarfs any transition investment. Prevention is categorically cheaper than recovery.',
    score: 5, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'econ_realist',
  },
  {
    id: 'demo1-f1a1',
    treeId: 'demo1', parentId: 'demo1-f1', parentRelation: 'against',
    text: "Tipping point timelines are contested even within climate science. Policy built on worst-case outliers risks misallocating trillions. The IPCC's own confidence intervals are wide.",
    score: 4, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'policy_skeptic',
  },

  // ── Level 3: children of demo1-f2 (energy independence) ──────────────────────
  {
    id: 'demo1-f2f1',
    treeId: 'demo1', parentId: 'demo1-f2', parentRelation: 'for',
    text: "Russia's 2022 gas cutoff threw Europe into an energy crisis, spiked inflation, and forced emergency coal restarts. Renewables are the only durable exit from that vulnerability.",
    score: 11, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'geo_watcher',
  },
  {
    id: 'demo1-f2a1',
    treeId: 'demo1', parentId: 'demo1-f2', parentRelation: 'against',
    text: "Renewable independence is mostly theoretical — critical mineral supply chains (lithium, cobalt, rare earths) are more geographically concentrated than oil, and China controls most of them.",
    score: 7, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'supply_chain_watch',
  },

  // ── Level 3: children of demo1-f3 (green jobs) ────────────────────────────────
  {
    id: 'demo1-f3f1',
    treeId: 'demo1', parentId: 'demo1-f3', parentRelation: 'for',
    text: "Germany's Energiewende created 300,000 renewable jobs by 2020. The US Inflation Reduction Act has already attracted $300B+ in clean energy investment. First-mover advantage is real.",
    score: 6, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'industrialist_42',
  },
  {
    id: 'demo1-f3a1',
    treeId: 'demo1', parentId: 'demo1-f3', parentRelation: 'against',
    text: "Green job projections consistently outpace reality. Fossil jobs lost are in specific communities; green jobs created are in different places requiring different skills. The transition tears communities apart.",
    score: 5, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'rust_belt_voice',
  },

  // ── Level 3: children of demo1-f4 (reparative justice) ───────────────────────
  {
    id: 'demo1-f4a1',
    treeId: 'demo1', parentId: 'demo1-f4', parentRelation: 'against',
    text: "Reparative justice framing makes climate policy about historical guilt rather than future outcomes. It alienates moderate voters needed for durable political coalitions and derails practical action.",
    score: 4, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'pragmatic_green',
  },

  // ── Level 3: children of demo1-a1 (low-income burden) ────────────────────────
  {
    id: 'demo1-a1f1',
    treeId: 'demo1', parentId: 'demo1-a1', parentRelation: 'for',
    text: "France's carbon dividend — returning all revenue directly to households — reduced inequality while cutting emissions. Equitable transition is empirically proven, not just theoretical.",
    score: 7, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'policy_lab',
  },
  {
    id: 'demo1-a1a1',
    treeId: 'demo1', parentId: 'demo1-a1', parentRelation: 'against',
    text: 'Fossil fuel subsidies already redistribute wealth upward to car owners and industry. Energy poverty under the status quo is severe. The baseline we are trying to protect is already broken.',
    score: 9, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'subsidy_tracker',
  },

  // ── Level 3: children of demo1-a2 (grid reliability) ─────────────────────────
  {
    id: 'demo1-a2f1',
    treeId: 'demo1', parentId: 'demo1-a2', parentRelation: 'for',
    text: 'Battery storage costs fell 97% between 1991 and 2023. Grid-scale storage is now cost-competitive in most markets and deployment is accelerating exponentially.',
    score: 10, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'battery_tech',
  },
  {
    id: 'demo1-a2a1',
    treeId: 'demo1', parentId: 'demo1-a2', parentRelation: 'against',
    text: "Even with cheap batteries, multi-week low-wind, low-sun winter periods require seasonal storage measured in months, not hours. No grid at scale has solved this.",
    score: 8, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'grid_eng_2031',
  },

  // ── Level 3: children of demo1-a3 (developing nations) ───────────────────────
  {
    id: 'demo1-a3f1',
    treeId: 'demo1', parentId: 'demo1-a3', parentRelation: 'for',
    text: 'Solar and wind are now cheaper than coal in two-thirds of the world. Developing nations that skip fossil infrastructure and go straight to renewables avoid the stranded-asset trap entirely.',
    score: 12, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'energy_access',
  },
  {
    id: 'demo1-a3a1',
    treeId: 'demo1', parentId: 'demo1-a3', parentRelation: 'against',
    text: "Cheapest per-kWh doesn't mean cheapest transition. Developing nations lack the grid infrastructure, financing markets, and regulatory capacity that make renewables reliable. Comparisons to OECD grids are misleading.",
    score: 6, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'dev_economist',
  },

  // ── Level 3: children of demo1-a4 (market will handle it) ────────────────────
  {
    id: 'demo1-a4a1',
    treeId: 'demo1', parentId: 'demo1-a4', parentRelation: 'against',
    text: "The IMF estimates $7 trillion in annual global fossil fuel subsidies — explicit and implicit. Markets are not pricing carbon freely. The 'let markets decide' argument assumes a market that doesn't exist.",
    score: 14, forCount: 0, againstCount: 0,
    authorDeviceId: U, authorUsername: 'subsidy_tracker',
  },
]

export async function seedDemo() {
  // Delete all existing arguments for this tree (including any user-added ones)
  const snap = await getDocs(query(collection(db, 'arguments'), where('treeId', '==', DEMO_TREE_ID)))
  if (snap.size > 0) {
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
  }

  // Recreate tree doc and all seed arguments
  await setDoc(doc(db, 'trees', DEMO_TREE_ID), {
    rootArgumentId: DEMO_ROOT_ID,
    createdAt: serverTimestamp(),
  })
  await Promise.all(
    ARGS.map(({ id, ...data }) =>
      setDoc(doc(db, 'arguments', id), { ...data, createdAt: serverTimestamp() })
    )
  )
}
