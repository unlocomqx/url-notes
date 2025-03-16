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

  let bold = true
  let italic = true
  let underline = true
  let link = true
  let placeholder = 'Edit note...'

  const setLink = () => {
    if (!editor) {
      return
    }

    if (editor.isActive('link')) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()

      return
    }

    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL', previousUrl)

    // cancelled
    if (url === null) {
      return
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()

      return
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({href: url}).run()
  }

  onMount(() => {
    editor = new Editor({
      element: element,
      extensions: [
        StarterKit,
        Link.configure({
          HTMLAttributes: {rel: null, target: null},
          autolink: true
        }),
        Underline,
        BubbleMenu.configure({
          element: bubble_menu,
          tippyOptions: {duration: 100, theme: 'local', maxWidth: 450, appendTo: document.body}
        }),
        Placeholder.configure({placeholder})
      ],
      editorProps: {
        attributes: {
          class: 'p-2 focus:outline-none',
        },
      },
      content,
      onTransaction: () => {
        // force re-render so `editor.isActive` works as expected
        editor = editor
        handleChange()
      },
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
</script>

<div bind:this={bubble_menu}
     class="join shadow-md">
  {#if editor}
    {#if bold}
      <button type="button"
              class="btn join-item {editor.isActive('bold')
          ? 'text-primary'
          : ''}"
              onclick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Icon icon="ic:baseline-format-bold"/>
      </button>
    {/if}

    {#if italic}
      <button type="button"
              class="btn join-item {editor.isActive('italic')
          ? 'text-primary'
          : ''}"
              onclick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Icon icon="ic:baseline-format-italic"/>
      </button>
    {/if}

    {#if underline}
      <button type="button"
              class="btn join-item {editor.isActive('underline')
          ? 'text-primary'
          : ''}"
              onclick={() => editor?.chain().focus().toggleUnderline().run()}
      >
        <Icon icon="ic:baseline-format-underlined"/>
      </button>
    {/if}

    {#if link}
      <label for="link_modal-{id}"
             class="btn join-item {editor.isActive('link')
          ? 'text-primary'
          : ''}"
      >
        <Icon icon="ic:baseline-link"/>
      </label>
    {/if}
  {/if}
</div>

<div bind:this={element}></div>

<input class="modal-toggle" id="link_modal-{id}" type="checkbox"/>
<div class="modal" role="dialog">
  <div class="modal-box">
    <h3 class="text-lg font-bold">Insert a link</h3>
    <fieldset class="fieldset">
      <div class="join">
        <input class="input join-item" placeholder="Type here" type="text"/>
        <button class="btn join-item" type="button">Add</button>
      </div>
    </fieldset>
  </div>
  <label class="modal-backdrop" for="link_modal-{id}">Close</label>
</div>

<style>
    :global(.tiptap a) {
        color: var(--color-primary);
        text-decoration: underline;
        cursor: pointer;
    }
</style>
