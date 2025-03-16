<script lang="ts">
  import Icon from "@iconify/svelte"
  import {type Context, db} from "../db"
  import {liveQuery} from "dexie"
  import { exec, init } from 'pell'

  let context = $state<Context>('page')

  async function AddNote() {
    const id = await db.notes.add({
      context,
      content: 'ABC'
    })

    console.log(id)
  }

  let filterNotes = (context: Context) => liveQuery(
    () => db.notes.where('context').equals(context).toArray()
  )
  let notes = $derived(filterNotes(context))

  function pell(node: HTMLDivElement, { id, content }:{id: number, content: string}) {
    const editor = init({
      element: node,
      onChange: (html: string) => {
        db.notes.update(id, { content: html })
      },
      actions:['bold','link','italic','underline']
    })

    editor.content.innerHTML = content
  }
</script>

<svelte:head>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/pell/dist/pell.min.css">
</svelte:head>

<div class="p-2 flex flex-col gap-2">
  <div class="tabs tabs-border" role="tablist">
    <input aria-label="Page" bind:group={context} class="tab" name="context" type="radio" value="page"/>
    <input aria-label="Website" bind:group={context} class="tab" name="context" type="radio" value="website"/>
    <input aria-label="Global" bind:group={context} class="tab" name="context" type="radio" value="global"/>
  </div>

  <div class="notes flex flex-col gap-2 min-h-16 border-2 border-base-300 rounded-lg p-4">
    {#each $notes as {id, content} (id)}
      <div class="p-2 border-2 border-base-300 rounded-lg"
           use:pell={{ id, content }}
      >
      </div>
    {/each}
  </div>

  <div>
    <button class="btn btn-primary" onclick={AddNote}>
      <Icon icon="ic:add"/>
      New Note
    </button>
  </div>
</div>

<style>

</style>
