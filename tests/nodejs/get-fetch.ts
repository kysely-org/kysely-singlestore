import nodeFetch from 'node-fetch'
import {fetch as undiciFetch} from 'undici'

export function getFetch() {
  const {version} = process

  console.log('version', version)

  if (version.startsWith('v18')) {
    return fetch
  }

  if (version.startsWith('v16')) {
    return undiciFetch
  }

  return nodeFetch
}
