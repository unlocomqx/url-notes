<script lang="ts">
  import Icon from "@iconify/svelte"
  import {type Context, db} from "../db"
  import {liveQuery} from "dexie"
  import Editor from "../lib/Editor.svelte"
  import browser from "webextension-polyfill"
  import {onMount} from "svelte"

  let context = $state<Context>('page')
  let context_url = $state<string>('')

  async function AddNote() {
    let url: string | undefined = ''

    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0]

    if (context === 'page') {
      if (tab.url) {
        const page_url = new URL(tab.url)
        url = getPageUrl(page_url)
      }
    } else if (context === 'website') {
      if (tab.url) {
        const page_url = new URL(tab.url)
        url = page_url.origin
      }
    }

    if (!url) {
      url = ''
    }

    const id = await db.notes.add({
      context,
      content: '',
      url
    })

    console.log(id)
  }

  let filterNotes = (context: Context, context_url: string) => liveQuery(
    () => {
      let url = ''
      if (context === 'global') {
        url = ''
      } else if (context === 'page') {
        if (context_url) {
          const page_url = new URL(context_url)
          url = getPageUrl(page_url)
        }
      } else if (context === 'website') {
        if (context_url) {
          const page_url = new URL(context_url)
          url = page_url.origin
        }
      }

      return db.notes
        .where({context, url})
        .toArray()
    }
  )
  let notes = $derived(filterNotes(context, context_url))

  function getPageUrl(url: URL) {
    let without_hash = url.href.replace(url.hash, '')
    return without_hash.replace(/#$/, '')
  }

  onMount(() => {
    browser.tabs.query({active: true, currentWindow: true})
      .then((tabs) => {
        const tab = tabs[0]
        context_url = tab.url || ''
      })
  })
</script>

<div class="p-1 flex flex-col gap-2">
  <div class="tabs tabs-border" role="tablist">
    <input aria-label="Page" bind:group={context} class="tab" name="context" type="radio" value="page"/>
    <input aria-label="Website" bind:group={context} class="tab" name="context" type="radio" value="website"/>
    <input aria-label="Global" bind:group={context} class="tab" name="context" type="radio" value="global"/>
  </div>

  <div class="notes flex flex-col gap-2">
    {#each $notes as {id, content} (id)}
      <div class="group relative border-2 border-base-300 rounded-lg focus-within:border-2 focus-within:border-accent">
        <Editor {id} {content} onchange={(content) => {
          db.notes.update(id, {content})
        }}/>

        <div class="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100">
          <button class="btn btn-xs btn-error"
                  onclick={() => {
                      if(true || confirm('Are you sure?')) {
                        db.notes.delete(id)
                      }
                  }}
          >
            <Icon icon="ic:baseline-delete"/>
          </button>
        </div>
      </div>
    {/each}
  </div>

  <div>
    <button class="btn btn-primary btn-sm" onclick={AddNote}>
      <Icon icon="ic:add"/>
      {#if context === 'page'}
        New page note
      {:else if context === 'website'}
        New website note
      {:else}
        New global note
      {/if}
    </button>
  </div>
</div>

<style>

</style>
