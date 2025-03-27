<script lang="ts">
  import ThemeController from "../lib/ThemeController.svelte"
  import browser from "webextension-polyfill"
  import Icon from "@iconify/svelte"

  async function exportNotes(){
    const origins =  await browser.storage.sync.getKeys()
    const data = {}
    for (const origin of origins) {
      const notes = await browser.storage.sync.get(origin)
      data[origin] = notes[origin]
    }

    // download the data as a json file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notes-by-url-' + new Date().toISOString() + '.json';
    a.click();
    a.remove();
  }

  function importNotes(){
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement)?.files?.[0]
      if(!file){
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
        for (const origin in data) {
          await browser.storage.sync.set({ [origin]: data[origin] })
        }
        alert("Notes imported successfully")
      }
      reader.readAsText(file)
    }
    input.click()
  }
</script>

<div class="p-1 flex flex-col gap-2">
  <div class="hidden">
    <ThemeController/>
  </div>

  <div class="card w-96 bg-base-100 card-xs shadow-sm">
    <div class="card-body">
      <h2 class="card-title">Import / Export data</h2>
      <p>You can import or export a json file containing your notes</p>
      <div class="justify-end card-actions">
        <button class="btn btn-secondary" onclick={importNotes}>
          <Icon icon="ic:baseline-upload" />
          Import notes
        </button>
        <button class="btn btn-primary" onclick={exportNotes}>
          <Icon icon="ic:baseline-download" />
          Export notes
        </button>
      </div>
    </div>
  </div>
</div>
