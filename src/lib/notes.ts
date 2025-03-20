import browser from "webextension-polyfill"
import Autolinker from "autolinker"

export type Context = 'page' | 'website' | 'global'
export type Note = {
  id: string
  origin: string
  context: Context
  url: string
  content: string
}
export type Notes = Record<Context, Note[]>

export async function addNote(context = '', content = '') {
  let url: string | undefined = ''
  let origin: string = 'global'

  const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0]

  if (context === 'page') {
    if (tab.url) {
      const page_url = new URL(tab.url)
      url = getPageUrl(page_url)
      origin = page_url.origin
    }
  } else if (context === 'website') {
    if (tab.url) {
      const page_url = new URL(tab.url)
      url = page_url.origin
      origin = page_url.origin
    }
  }

  if (!url) {
    url = ''
  }

  let notes = await browser.storage.sync.get(origin)
    .then(notes => notes[origin]) as Notes

  if (!notes?.[context]) {
    notes = {
      "page": [],
      "website": [],
      "global": [],
    }
  }

  if (!notes[context]) {
    notes[context] = []
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

  let new_note = {
    id: new Date().getTime().toString(),
    origin,
    context,
    url,
    content: autolinked_content,
  }
  notes[context].push(new_note)

  await browser.storage.sync.set({
    [origin]: notes,
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
