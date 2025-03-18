<script lang="ts">
  import {onDestroy, onMount} from 'svelte'
  import {Editor} from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import Placeholder from '@tiptap/extension-placeholder'
  import Link from '@tiptap/extension-link'
  import Underline from '@tiptap/extension-underline'
  import Icon from "@iconify/svelte"

  let {id, content, onchange} = $props()

  let element: HTMLDivElement
  let bubble_menu: HTMLDivElement
  let editor = $state<Editor | undefined>()
  let rerender_key = $state(0)

  let bold = true
  let italic = true
  let underline = true
  let link = true
  let placeholder = 'Edit note...'

  let url = $state('')
  let link_modal_open = $state(false)
  const setLink = () => {
    if (!editor) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      link_modal_open = false
      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({href: url}).run()
    link_modal_open = false
  }

  onMount(() => {
    editor = new Editor({
      element: element,
      extensions: [
        StarterKit,
        Placeholder.configure({placeholder}),
        Link.configure({
          HTMLAttributes: {rel: null, target: null},
          autolink: true
        }),
        Underline,
        BubbleMenu.configure({
          element: bubble_menu,
          tippyOptions: {duration: 100, theme: 'local', maxWidth: 450, appendTo: document.body}
        }),
      ],
      editorProps: {
        attributes: {
          class: 'focus:outline-none',
        },
      },
      content,
      onTransaction: ({editor: instance}) => {
        // force re-render so `editor.isActive` works as expected
        editor = instance
        rerender_key += 1
        handleChange()
      }
    })
  })

  function handleChange() {
    const html = editor?.getHTML()
    if (html !== content) {
      content = html
      onchange(html)
    }
  }

  onDestroy(() => {
    if (editor) {
      editor.destroy()
    }
  })

  let is_bold = $derived.by(() => rerender_key && editor?.isActive('bold'))
  let is_italic = $derived.by(() => rerender_key && editor?.isActive('italic'))
  let is_underline = $derived.by(() => rerender_key && editor?.isActive('underline'))
  let is_link = $derived.by(() => rerender_key && editor?.isActive('link'))
</script>

<div bind:this={bubble_menu}
     class="join shadow-md">
  {#if editor && rerender_key}
    {#if bold}
      <button type="button"
              class="btn join-item {is_bold ? 'bg-primary text-primary-content' : ''}"
              onclick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Icon icon="ic:baseline-format-bold"/>
      </button>
    {/if}

    {#if italic}
      <button type="button"
              class="btn join-item {is_italic ? 'bg-primary text-primary-content' : ''}"
              onclick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Icon icon="ic:baseline-format-italic"/>
      </button>
    {/if}

    {#if underline}
      <button type="button"
              class="btn join-item {is_underline ? 'bg-primary text-primary-content' : ''}"
              onclick={() => editor?.chain().focus().toggleUnderline().run()}
      >
        <Icon icon="ic:baseline-format-underlined"/>
      </button>
    {/if}

    {#if link}
      <label for="link_modal-{id}"
             class="btn join-item {is_link ? 'bg-primary text-primary-content': ''}"
      >
        <Icon icon="ic:baseline-link"/>
      </label>
    {/if}

    {#if is_link}
      <button type="button"
              class="btn join-item"
              onclick={() => {
                editor?.chain().focus().unsetLink().run()
              }}
      >
        <Icon icon="ic:baseline-link-off"/>
      </button>
    {/if}
  {/if}
</div>

<div onpaste={(e) => e.stopPropagation()}>
  <div bind:this={element}></div>
</div>

<input bind:checked={link_modal_open} class="modal-toggle" id="link_modal-{id}" type="checkbox"/>
<div class="modal" role="dialog" onpaste={(e) => e.stopPropagation()}>
  <div class="modal-box">
    <h3 class="text-lg font-bold">Insert a link</h3>
    <fieldset class="fieldset">
      <form class="flex flex-col gap-2" onsubmit={(e) => {
        e.preventDefault()
        setLink()
      }}>
        <input bind:value={url} class="input" placeholder="https://" type="text"/>
        <div class="flex justify-between">
          <button class="btn btn-primary w-fit" onclick={setLink} type="submit">
            <Icon icon="ic:baseline-insert-link"/>
            Insert
          </button>
          <button class="btn w-fit" onclick={setLink} type="submit">
            <Icon icon="ic:close"/>
            Cancel
          </button>
        </div>
      </form>
    </fieldset>
  </div>
  <label class="modal-backdrop" for="link_modal-{id}">Close</label>
</div>

<style lang="postcss">
    @import "tailwindcss";

    @plugin "daisyui";

    :global(.tiptap a) {
        @apply text-base-content font-medium underline cursor-pointer;
    }

    :global(.tiptap p.is-editor-empty:first-child:before) {
        color: oklch(from var(--color-base-content) l c h / 0.6);
        content: attr(data-placeholder);
        float: left;
        height: 0;
        pointer-events: none
    }
</style>
