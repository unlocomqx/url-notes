<script lang="ts">
  import {LocalStore} from "./persist.svelte"

  let themes = [
    {name: 'Light', value: 'light'},
    {name: 'Silk', value: 'silk'},
    {name: 'Dark', value: 'dark'},
    {name: 'Retro', value: 'retro'},
    {name: 'Garden', value: 'garden'},
    {name: 'Forest', value: 'forest'},
    {name: 'Pastel', value: 'pastel'},
    {name: 'Dracula', value: 'dracula'},
    {name: 'Acid', value: 'acid'},
    {name: 'Night', value: 'night'},
    {name: 'Dim', value: 'dim'},
    {name: 'Abyss', value: 'abyss'},
    {name: 'Nord', value: 'nord'},
    {name: 'Sunset', value: 'sunset'},
  ]
  const current_theme = new LocalStore<string>('current_theme', 'light')

  $effect(() => {
    document.documentElement.dataset.theme = current_theme.value
  })
</script>

<div class="dropdown dropdown-bottom dropdown-end">
  <div class="btn m-1" role="button" tabindex="0">
    Theme
    <svg
        class="inline-block h-2 w-2 fill-current opacity-60"
        height="12px"
        viewBox="0 0 2048 2048"
        width="12px"
        xmlns="http://www.w3.org/2000/svg">
      <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
    </svg>
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <ul class="dropdown-content bg-base-300 rounded-box z-1 w-48 overflow-auto p-2 shadow-2xl" tabindex="0">
    {#each themes as {name, value}}
      <li>
        <label
            class="btn btn-sm btn-ghost grow flex items-center gap-2"
            class:active={current_theme.value === value}
            for="theme-{value}"
        >
          <input
              aria-label="{name}"
              bind:group={current_theme.value}
              class="theme-controller hidden"
              name="theme-dropdown"
              type="radio"
              id="theme-{value}"
              {value}
          />
          <div data-theme={value} class="bg-transparent -skew-x-12">
            <div class="flex border border-base-300">
            <div class="bg-primary w-2 h-6 "></div>
            <div class="bg-primary-content w-2 h-6"></div>
            <div class="bg-secondary w-2 h-6"></div>
            <div class="bg-accent w-2 h-6"></div>
            </div>
          </div>
          <span class="text-left grow">{name}</span>
        </label>
      </li>
    {/each}
  </ul>
</div>

<style lang="postcss">
    @import "tailwindcss";

    @plugin "daisyui";

    .active {
        @apply bg-primary text-primary-content;
    }
</style>
