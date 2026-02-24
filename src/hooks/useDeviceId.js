import { nanoid } from 'nanoid'

export function useDeviceId() {
  let id = localStorage.getItem('deviceId')
  if (!id) {
    id = nanoid()
    localStorage.setItem('deviceId', id)
  }
  return id
}
