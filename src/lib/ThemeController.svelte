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

  $inspect(current_theme.value)
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
  <ul class="dropdown-content bg-base-300 rounded-box z-1 w-52 p-2 shadow-2xl" tabindex="0">
    {#each themes as {name, value}}
      <li>
        <input
            aria-label="{name}"
            bind:group={current_theme.value}
            class="theme-controller btn btn-sm btn-block btn-ghost justify-start"
            class:active={current_theme.value === value}
            name="theme-dropdown"
            type="radio"
            {value}/>
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
