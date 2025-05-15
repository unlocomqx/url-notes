<script lang="ts">
  import ThemeController from "../lib/ThemeController.svelte"
  import browser from "webextension-polyfill"
  import Icon from "@iconify/svelte"
  import {type Context, getContextInfo, type Note} from "../lib/notes"

  async function exportNotes() {
    const keys = await browser.storage.sync.getKeys()
    const data = {}
    for (const key of keys) {
      const notes = await browser.storage.sync.get(key)
      data[key] = notes[key]
    }

    // download the data as a json file
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: "application/json"})
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notes-by-url-' + new Date().toISOString() + '.json'
    a.click()
    a.remove()
  }

  function importNotes() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0]
      if (!file) {
        alert("No file selected")
        return
      }
      const reader = new FileReader()
      reader.onload = async (e) => {
        let result = e.target?.result
        if (!result) {
          alert("Error reading file")
          return
        }
        const data = JSON.parse(result.toString())
        for (const key in data) {
          await browser.storage.sync.set({[key]: data[key]})
        }
        alert("Notes imported successfully")
        await checkData()
      }
      reader.readAsText(file)
    }
    input.click()
  }

  let is_old_format = $state(false)

  async function checkData() {
    is_old_format = false
    const keys = await browser.storage.sync.getKeys()
    for (const key of keys) {
      const notes = await browser.storage.sync.get(key)
        .then(notes => notes[key]) as Note[]
      if ("global" in notes) {
        is_old_format = true
      }
    }
  }

  async function convertData() {
    const keys = await browser.storage.sync.getKeys()
    let old_data = {}
    for (const key of keys) {
      const notes = await browser.storage.sync.get(key)
        .then(notes => notes[key]) as Record<Context, Note[]>
      old_data[key] = notes

      await browser.storage.sync.remove(key)
    }

    for (const key in old_data) {
      const notes = old_data[key]
      if ("global" in old_data[key]) {
        const all_notes = [
          ...notes.global,
          ...notes.website,
          ...notes.page,
        ]
        for (const note of all_notes) {
          const {key} = await getContextInfo(note.context, note.url)
          await browser.storage.sync.set({
            [key]: note,
          })
        }
      }
    }

    alert('Data converted successfully')
    await checkData()
  }

  $effect(() => {
    checkData()
  })
</script>

<div class="p-1 flex flex-col gap-2">
  <div class="hidden">
    <ThemeController/>
  </div>

  <div class="card card-border w-96 bg-base-100 card-xs shadow-sm">
    <div class="card-body">
      <h2 class="card-title">Import / Export data</h2>
      <p>You can import or export a json file containing your notes</p>
      <div class="justify-end card-actions">
        <button class="btn btn-secondary" onclick={importNotes}>
          <Icon icon="ic:baseline-upload"/>
          Import notes
        </button>
        <button class="btn btn-primary" onclick={exportNotes}>
          <Icon icon="ic:baseline-download"/>
          Export notes
        </button>
      </div>
    </div>
  </div>
</div>

{#if is_old_format}
  <div class="card card-border w-96 bg-base-100 card-xs shadow-sm">
    <div class="card-body">
      <h2 class="card-title">Data check</h2>

      <p class="alert alert-warning block">
        Your data is in the old format. Please <strong>export your data</strong> then click the button below to convert
        it to the new format.
      </p>

      <div class="justify-end card-actions">
        <button class="btn btn-primary" onclick={convertData}>
          Convert data
        </button>
      </div>
    </div>
  </div>
{/if}
