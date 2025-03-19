<script lang="ts">
  import Icon from "@iconify/svelte"
  import {type Context} from "../db"
  import Editor from "../lib/Editor.svelte"
  import browser from "webextension-polyfill"
  import {onMount} from "svelte"
  import ThemeController from "../lib/ThemeController.svelte"

  let context = $state<Context>('page')
  let context_url = $state<string>('')

  type Note = {
    id: string
    origin: string
    context: Context
    url: string
    content: string
  }
  type Notes = Record<Context, Note[]>

  async function addNote(content = '') {
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

    notes[context].push({
      id: new Date().getTime().toString(),
      origin,
      context,
      url,
      content,
    })

    await browser.storage.sync.set({
      [origin]: notes,
    })

    note_rows = filterNotes(context, context_url)
  }

  async function addNoteFromClipboard() {
    const text = await navigator.clipboard.readText()
    if (!text) {
      return
    }

    return addNote(text)
  }

  async function addNoteFromSelection() {
    browser.tabs.query({active: true, currentWindow: true})
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

        if(!result) {
          return
        }

        return addNote(result as string)
      })
  }

  function pasteNote(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text/plain')

    if (!text) {
      return
    }

    addNote(text)
  }

  function saveNote(note: Note) {
    return async (new_content: string) => {
      const {id, origin, context} = note

      const notes = await browser.storage.sync.get(origin)
        .then(notes => notes[origin]) as Notes

      if (notes[context] === undefined) {
        return
      }

      let note_index = notes[context].findIndex((n: Note) => n.id === id)

      if (note_index === -1) {
        return
      }

      notes[context][note_index] = {
        ...notes[context][note_index],
        content: new_content,
      }

      await browser.storage.sync.set({
        [origin]: notes,
      })
    }
  }

  async function deleteNote(note: Note) {
    const {id, origin, context} = note

    const notes = await browser.storage.sync.get(origin)
      .then(notes => notes[origin]) as Notes

    if (notes[context] === undefined) {
      return
    }

    let note_index = notes[context].findIndex((n: Note) => n.id === id)

    if (note_index === -1) {
      return
    }

    notes[context].splice(note_index, 1)

    await browser.storage.sync.set({
      [origin]: notes,
    })

    note_rows = filterNotes(context, context_url)
  }

  async function filterNotes(context: Context, context_url: string) {
    let origin = ''
    let url = ''
    if (context === 'global') {
      origin = 'global'
    } else if (context === 'page') {
      if (context_url) {
        const page_url = new URL(context_url)
        origin = page_url.origin
        url = getPageUrl(page_url)
      }
    } else if (context === 'website') {
      if (context_url) {
        const page_url = new URL(context_url)
        origin = page_url.origin
      }
    }

    const notes = await browser.storage.sync.get(origin).then(notes => notes[origin]) as Notes
    if (!notes) {
      return []
    }

    if(url) {
      notes[context] = notes[context].filter((note: Note) => note.url === url)
    }

    return notes[context]
  }

  let note_rows = $state(filterNotes(context, context_url))

  $effect(() => {
    note_rows = filterNotes(context, context_url)
  })

  onMount(() => {
    browser.storage.onChanged.addListener((changes, namespace) => {
      if (namespace !== 'sync') {
        return
      }
      // notes = filterNotes(context, context_url)
    })
  })

  function getPageUrl(url: URL) {
    let without_hash = url.href.replace(url.hash, '')
    return without_hash.replace(/#$/, '')
  }

  onMount(() => {
    browser.tabs.query({active: true, currentWindow: true})
      .then((tabs) => {
        const tab = tabs[0]
        context_url = tab.url || ''
        if (context_url) {
          const url = new URL(context_url)
          let stored_contexts = localStorage.getItem('context')
          let contexts = JSON.parse(stored_contexts || '{}')
          if (contexts[url.origin]) {
            context = contexts[url.origin]
          } else {
            context = 'page'
          }
        }
      })
  })

  $effect(() => {
    if (context_url) {
      const url = new URL(context_url)
      let stored_contexts = localStorage.getItem('context')
      let contexts = JSON.parse(stored_contexts || '{}')
      contexts[url.origin] = context
      localStorage.setItem('context', JSON.stringify(contexts))
    }
  })
</script>


<svelte:body onpaste={pasteNote}/>

<div class="p-1 flex flex-col gap-2">
  <div class="flex justify-between items-center">
    <div class="tabs tabs-border" role="tablist">
      <input aria-label="Page" bind:group={context} class="tab" name="context" type="radio" value="page"/>
      <input aria-label="Website" bind:group={context} class="tab" name="context" type="radio" value="website"/>
      <input aria-label="Global" bind:group={context} class="tab" name="context" type="radio" value="global"/>
    </div>
    <ThemeController/>
    <a href="https://github.com/unlocomqx/url-notes" target="_blank" class="btn btn-primary btn-sm" title="Open GitHub repo">
      <Icon icon="mdi:github"/>
    </a>
  </div>

  <div class="notes flex flex-col gap-2">
    {#await note_rows then notes_list}
      {#each notes_list as note (note.id)}
        {@const {id, content} = note}
        <div class="group relative border-2 border-base-300 p-2 bg-base-200 rounded-lg focus-within:border-accent">
          <Editor {id} {content} onchange={saveNote(note)}/>

          <div class="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100">
            <button class="btn btn-xs btn-error"
                    onclick={() => {
                      if(confirm('Are you sure?')) {
                        deleteNote(note)
                      }
                  }}
            >
              <Icon icon="ic:baseline-delete"/>
            </button>
          </div>
        </div>
      {:else}
        <div
            class="group relative border-2 border-base-300 text-base-content/60 p-2 bg-base-200 rounded-lg flex items-center gap-1">
          <Icon icon="ic:baseline-speaker-notes-off"/>
          Click the button below to add a note in the current context.
        </div>
      {/each}
    {/await}
  </div>

  <div class="flex gap-2 p-2">
    <button class="btn btn-primary btn-sm" onclick={() => addNote()}>
      <Icon icon="ic:add"/>
      {#if context === 'page'}
        New page note
      {:else if context === 'website'}
        New website note
      {:else}
        New global note
      {/if}
    </button>
    <button class="btn btn-primary btn-sm" onclick={addNoteFromClipboard}
            title="Add from clipboard (or press ctrl + v)">
      <Icon icon="ic:baseline-content-paste"/>
    </button>
    <button class="btn btn-primary btn-sm" onclick={addNoteFromSelection} title="Add from current selection">
      <Icon icon="mdi:invoice-text-plus-outline"/>
    </button>
  </div>
</div>

<style>

</style>
