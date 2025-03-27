<script lang="ts">
  import Icon from "@iconify/svelte"
  import Editor from "../lib/Editor.svelte"
  import browser, {Commands, type Tabs} from "webextension-polyfill"
  import {onMount} from "svelte"
  import ThemeController from "../lib/ThemeController.svelte"
  import {
    addNote,
    addNoteFromClipboard,
    addNoteFromSelection,
    type Context,
    getPageUrl,
    type Note,
    type Notes
  } from "../lib/notes"

  let context = $state<Context>('page')
  let context_url = $state<string>('')
  let current_tab = 0
  let new_note_id = ''
  let notes_list = $state<Note[]>([])
  let extra_notes = $state<Note[]>([])

  let clipboard_command = $state<Commands.Command>()
  let selection_command = $state<Commands.Command>()

  async function addNewNote() {
    const new_note = await addNote(context)
    new_note_id = new_note.id
    await loadNotes(context, context_url)
  }

  async function addNewNoteFromClipboard() {
    const new_note = await addNoteFromClipboard(context)
    new_note_id = new_note?.id ?? ''
    await loadNotes(context, context_url)
  }

  async function addNewNoteFromSelection() {
    const new_note = await addNoteFromSelection(context)
    new_note_id = new_note?.id ?? ''
    await loadNotes(context, context_url)
  }

  async function pasteNote(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text/plain')

    if (!text) {
      return
    }

    const new_note = await addNote(context, text)
    new_note_id = new_note.id
    await loadNotes(context, context_url)
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
    const {id, origin, context: note_context} = note

    const notes = await browser.storage.sync.get(origin)
      .then(notes => notes[origin]) as Notes

    if (notes[note_context] === undefined) {
      return
    }

    let note_index = notes[note_context].findIndex((n: Note) => n.id === id)

    if (note_index === -1) {
      return
    }

    notes[note_context].splice(note_index, 1)

    await browser.storage.sync.set({
      [origin]: notes,
    })

    await loadNotes(context, context_url)
  }

  async function loadNotes(context: Context, context_url: string) {
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

    if (url) {
      notes[context] = notes[context].filter((note: Note) => note.url === url)
    }

    notes_list = notes[context]
    extra_notes = []
    if (context === 'website') {
      const page_notes = notes['page']
      if (page_notes.length) {
        extra_notes = [{
          id: 'separator',
          content: 'Page notes',
          context: 'page',
          origin: origin,
          url: '',
        }]
      }
      extra_notes = [...extra_notes, ...page_notes]
    }
  }

  $effect(() => {
    loadNotes(context, context_url)
  })

  onMount(() => {
    browser.storage.onChanged.addListener((_, namespace) => {
      if (namespace !== 'sync') {
        return
      }
      // notes = filterNotes(context, context_url)
    })
  })

  onMount(() => {
      browser.tabs.query({active: true, currentWindow: true})
        .then((tabs) => {
          const tab = tabs[0]
          current_tab = tab.id || 0
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

      let handleTabChange = async (id: number, _, tab: Tabs.Tab) => {
        if (id === current_tab) {
          context_url = tab.url || ''
          await loadNotes(context, context_url)
        }
      }
      browser.tabs.onUpdated.addListener(handleTabChange)

      let handleMessage = ({command}: any) => {
        if (command == 'add-note-from-selection') {
          addNewNoteFromSelection()
        }
        if (command == 'add-note-from-clipboard') {
          addNewNoteFromClipboard()
        }
      }
      browser.runtime.onMessage.addListener(handleMessage)

      browser.commands.getAll().then((cmds) => {
        clipboard_command = cmds.find((cmd) => cmd.name === 'add-note-from-clipboard')
        selection_command = cmds.find((cmd) => cmd.name === 'add-note-from-selection')
      })

      return () => {
        browser.tabs.onUpdated.removeListener(handleTabChange)
        browser.runtime.onMessage.removeListener(handleMessage)
      }
    }
  )

  $effect(() => {
    if (context_url) {
      const url = new URL(context_url)
      let stored_contexts = localStorage.getItem('context')
      let contexts = JSON.parse(stored_contexts || '{}')
      contexts[url.origin] = context
      localStorage.setItem('context', JSON.stringify(contexts))
    }
  })

  function focusNote(node: HTMLDivElement, {id}) {
    if (id !== new_note_id) {
      return
    }

    node.querySelector<HTMLDivElement>('.tiptap')?.focus()
  }
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
    <a class="btn btn-primary btn-sm" href="https://github.com/unlocomqx/url-notes" target="_blank"
       title="Open GitHub repo">
      <Icon icon="mdi:github"/>
    </a>
  </div>

  {#snippet notes(notes_list)}
    {#each notes_list as note (note.id)}
      {@const {id, content, context: note_context, url} = note}
      {#if id === 'separator'}
        <hr class="text-base-content/30"/>
        <h2 class="text-center text-base-content/60">{content}</h2>
      {:else}
        <div class="group relative border-2 border-base-300 p-2 bg-base-200 rounded-lg focus-within:border-accent"
             use:focusNote={{id}}
        >
          <Editor {id} {content} onchange={saveNote(note)}/>

          <div class="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100">
            {#if url && note_context !== context && context !== 'page'}
              <a target="_blank" href={url} title={url} class="btn btn-xs btn-secondary">
                <Icon icon="ic:baseline-open-in-new"/>
              </a>
            {/if}
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
      {/if}
    {:else}
      <div
          class="group relative border-2 border-base-300 text-base-content/60 p-2 bg-base-200 rounded-lg flex items-center gap-1">
        <button class="btn btn-xs btn-ghost" onclick={() => addNewNote()}>
          <Icon icon="ic:baseline-speaker-notes-off"/>
          Click the button below to add a note in the current context.
        </button>
      </div>
    {/each}
  {/snippet}

  <div class="notes flex flex-col gap-2">
    {@render notes(notes_list)}
  </div>

  <div class="flex gap-2 p-2">
    <button autofocus class="btn btn-primary btn-sm" onclick={() => addNewNote()}>
      <Icon icon="ic:add"/>
      {#if context === 'page'}
        New page note
      {:else if context === 'website'}
        New website note
      {:else}
        New global note
      {/if}
    </button>
    <button class="btn btn-primary btn-sm" onclick={addNewNoteFromClipboard}
            title="Add from clipboard / Press Ctrl+V in this popup">
      <Icon icon="ic:baseline-content-paste"/>
    </button>
    <button class="btn btn-primary btn-sm" onclick={addNewNoteFromSelection} title="Add from current selection">
      <Icon icon="mdi:invoice-text-plus-outline"/>
    </button>
    <a class="btn btn-primary btn-sm" href="https://github.com/unlocomqx/url-notes#shortcuts" target="_blank"
       title="Help">
      <Icon icon="ic:outline-help-outline"/>
    </a>
  </div>

  {#if extra_notes.length}
    <div class="notes flex flex-col gap-2">
      {@render notes(extra_notes)}
    </div>
  {/if}
</div>
