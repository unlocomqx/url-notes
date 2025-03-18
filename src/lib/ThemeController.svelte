<script lang="ts">
  import {LocalStore} from "./persist.svelte"
  import Icon from "@iconify/svelte"
  import {onMount} from "svelte"

  let themes = [
    {name: 'Light', value: 'light', type: 'light'},
    {name: 'Silk', value: 'silk', type: 'light'},
    {name: 'Retro', value: 'retro', type: 'light'},
    {name: 'Garden', value: 'garden', type: 'light'},
    {name: 'Pastel', value: 'pastel', type: 'light'},
    {name: 'Acid', value: 'acid', type: 'light'},
    {name: 'Nord', value: 'nord', type: 'light'},
    {name: 'Dark', value: 'dark', type: 'dark'},
    {name: 'Forest', value: 'forest', type: 'dark'},
    {name: 'Dracula', value: 'dracula', type: 'dark'},
    {name: 'Night', value: 'night', type: 'dark'},
    {name: 'Dim', value: 'dim', type: 'dark'},
    {name: 'Abyss', value: 'abyss', type: 'dark'},
    {name: 'Sunset', value: 'sunset', type: 'dark'},
  ]
  const current_theme = new LocalStore<string>('current_theme', 'light')
  const dark_light = new LocalStore<{ light: string, dark: string }>('dark_light', {
    light: 'light',
    dark: 'dark',
  })

  $effect(() => {
    document.documentElement.dataset.theme = current_theme.value
  })

  onMount(() => {
    // detect light / dark mode
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      current_theme.value = dark_light.value.dark
    } else {
      current_theme.value = dark_light.value.light
    }

    // add event listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (e.matches) {
        current_theme.value = dark_light.value.dark
      } else {
        current_theme.value = dark_light.value.light
      }
    })
  })
</script>

<div class="dropdown dropdown-bottom dropdown-end">
  <div class="btn btn-sm m-1" role="button" tabindex="0">
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
    {#each themes as {name, value, type}}
      <li>
        <label
            class="btn btn-sm btn-ghost grow flex items-center gap-2"
            class:active={current_theme.value === value}
            for="theme-{value}"
        >
          <input
              aria-label="{name}"
              bind:group={current_theme.value}
              onchange={() => {
                if(type === 'light') {
                  dark_light.value.light = value
                } else {
                  dark_light.value.dark = value
                }
              }}
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
          <span class="text-left grow flex gap-2 items-center">
            {#if type === 'light'}
              <Icon icon="ic:outline-wb-sunny"></Icon>
              {:else}
              <Icon icon="ic:outline-dark-mode"></Icon>
            {/if}
            {name}
          </span>
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
