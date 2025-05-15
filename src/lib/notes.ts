import browser from "webextension-polyfill"
import Autolinker from "autolinker"

export type Context = 'page' | 'website' | 'global'
export type Note = {
  id: string
  origin: string
  context: Context
  url: string
  content: string
  collapsed: boolean
}

export async function getContextInfo(context: Context, url?: string) {
  let origin: string = 'global'
  let key = origin

  if (!url) {
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0]
    url = tab.url || ''
  }

  if (context === 'page') {
    if (url) {
      const page_url = new URL(url)
      url = getPageUrl(page_url)
      origin = page_url.origin
      key = url
    }
  } else if (context === 'website') {
    if (url) {
      const page_url = new URL(url)
      url = page_url.origin
      origin = page_url.origin
      key = origin
    }
  }

  if (!url) {
    url = ''
  }

  return {url, origin, key}
}

export async function addNote(context: Context = 'page', content = '') {
  let {url, origin, key} = await getContextInfo(context)

  let notes = await browser.storage.sync.get(key)
    .then(notes => notes[key]) as Note[]

  if (!notes) {
    notes = []
  }

  const autolinker = new Autolinker({
    stripPrefix: false,
    stripTrailingSlash: false,
    className: 'autolink',
    newWindow: true,
    truncate: {
      length: 50,
      location: 'smart',
    },
  })

  const autolinked_content = autolinker.link(content)

  let new_note: Note = {
    id: new Date().getTime().toString(),
    origin,
    context,
    url,
    content: autolinked_content,
    collapsed: false
  }
  notes.push(new_note)

  await browser.storage.sync.set({
    [key]: notes,
  })

  return new_note
}

export async function addNoteFromSelection(context: Context) {
  return browser.tabs.query({active: true, currentWindow: true})
    .then(async (tabs) => {
      const tab = tabs[0]
      if (!tab.id) {
        return
      }
      const selection = await browser.scripting.executeScript({
        target: {tabId: tab.id},
        func: () => {
          return window?.getSelection()?.toString()
        }
      })

      const [{result}] = selection

      if (!result) {
        return
      }

      return addNote(context, result as string)
    })
}

export async function addNoteFromClipboard(context: Context) {
  const text = await navigator.clipboard.readText()
  if (!text) {
    return
  }

  return addNote(context, text)
}

export function getPageUrl(url: URL) {
  let without_hash = url.href.replace(url.hash, '')
  return without_hash.replace(/#$/, '')
}
