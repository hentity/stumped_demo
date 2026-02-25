import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,

  collection,
  query,
  where,
  serverTimestamp,
  runTransaction,
  increment,
} from 'firebase/firestore'
import { nanoid } from 'nanoid'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

// Creates the root argument and tree documents.
// Returns { treeId, argumentId }
export async function createTree(text, deviceId, username) {
  const treeId = nanoid(10)
  const argumentId = nanoid(10)

  await setDoc(doc(db, 'arguments', argumentId), {
    treeId,
    parentId: null,
    parentRelation: null,
    text,
    score: 0,
    forCount: 0,
    againstCount: 0,
    authorDeviceId: deviceId,
    authorUsername: username,
    createdAt: serverTimestamp(),
  })

  await setDoc(doc(db, 'trees', treeId), {
    rootArgumentId: argumentId,
    createdAt: serverTimestamp(),
  })

  return { treeId, argumentId }
}

// Fetches a tree document.
export async function getTree(treeId) {
  const snap = await getDoc(doc(db, 'trees', treeId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// Fetches a single argument document.
export async function getArgument(argumentId) {
  const snap = await getDoc(doc(db, 'arguments', argumentId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

// Fetches all child arguments for a given parent, filtered by parentRelation.
// Returns sorted by score descending (client-side).
export async function getChildArguments(treeId, parentId, parentRelation) {
  const q = query(
    collection(db, 'arguments'),
    where('treeId', '==', treeId),
    where('parentId', '==', parentId)
  )
  const snap = await getDocs(q)
  const args = snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(a => a.parentRelation === parentRelation)
    .sort((a, b) => b.score - a.score)
  return args
}

// Adds a new argument node to the tree.
export async function addArgument(treeId, parentId, parentRelation, text, deviceId, username) {
  const argumentId = nanoid(10)
  await setDoc(doc(db, 'arguments', argumentId), {
    treeId,
    parentId,
    parentRelation,
    text,
    score: 0,
    forCount: 0,
    againstCount: 0,
    authorDeviceId: deviceId,
    authorUsername: username,
    createdAt: serverTimestamp(),
  })
  // Increment parent's for/against count (non-fatal — requires updated Firestore rules)
  if (parentId) {
    const field = parentRelation === 'for' ? 'forCount' : 'againstCount'
    updateDoc(doc(db, 'arguments', parentId), { [field]: increment(1) }).catch(() => {})
  }
  return argumentId
}

// Soft-deletes an argument — marks it deleted rather than removing it,
// so child arguments remain intact and the thread stays readable.
export async function deleteArgument(argumentId) {
  await updateDoc(doc(db, 'arguments', argumentId), { deleted: true })
}

// Fetches all sources for a given argument.
export async function getSources(argumentId) {
  const q = query(
    collection(db, 'sources'),
    where('argumentId', '==', argumentId)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// Adds a source to an argument.
export async function addSource(argumentId, url, quote, deviceId) {
  const sourceId = nanoid(10)
  await setDoc(doc(db, 'sources', sourceId), {
    argumentId,
    url,
    quote: quote || '',
    addedByDeviceId: deviceId,
    createdAt: serverTimestamp(),
  })
  return sourceId
}

// Deletes a source document.
export async function deleteSource(sourceId) {
  await deleteDoc(doc(db, 'sources', sourceId))
}

// Fetches the current user's vote for an argument.
// Returns null, 1, or -1.
export async function getUserVote(argumentId, deviceId) {
  const voteRef = doc(db, 'votes', `${argumentId}_${deviceId}`)
  const snap = await getDoc(voteRef)
  if (!snap.exists()) return null
  return snap.data().value
}

// Casts, changes, or removes a vote on an argument.
// value should be 1 (upvote) or -1 (downvote).
export async function castVote(argumentId, deviceId, value) {
  const voteRef = doc(db, 'votes', `${argumentId}_${deviceId}`)
  const argRef = doc(db, 'arguments', argumentId)

  await runTransaction(db, async (transaction) => {
    const voteSnap = await transaction.get(voteRef)
    const argSnap = await transaction.get(argRef)
    const currentScore = argSnap.data().score

    if (!voteSnap.exists()) {
      // No existing vote — create and apply
      transaction.set(voteRef, { argumentId, deviceId, value })
      transaction.update(argRef, { score: currentScore + value })
    } else if (voteSnap.data().value === value) {
      // Same vote — remove (un-vote)
      transaction.delete(voteRef)
      transaction.update(argRef, { score: currentScore - value })
    } else {
      // Different vote — switch
      transaction.update(voteRef, { value })
      transaction.update(argRef, { score: currentScore + value * 2 })
    }
  })
}
