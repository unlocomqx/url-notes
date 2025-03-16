<script lang="ts">
  import {onDestroy, onMount} from 'svelte'
  import {Editor} from '@tiptap/core'
  import StarterKit from '@tiptap/starter-kit'
  import BubbleMenu from '@tiptap/extension-bubble-menu'
  import Placeholder from '@tiptap/extension-placeholder'
  import Link from '@tiptap/extension-link'
  import Underline from '@tiptap/extension-underline'
  import Icon from "@iconify/svelte"

  let {id, content} = $props()

  let element: HTMLDivElement
  let bubble_menu: HTMLDivElement
  let editor = $state<Editor | undefined>()

  let bold = true
  let italic = true
  let underline = true
  let link = true
  let placeholder = ''

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

    if (!/^https?:\/\//.test(url)) {
      window.alert('DIRECCIÓN INVÁLIDA!!')
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
          HTMLAttributes: {rel: null, target: null}
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
      },
    })
  })

  onDestroy(() => {
    if (editor) {
      editor.destroy()
    }
  })
</script>

<div bind:this={bubble_menu}
     class="flex gap-2 place-items-center border-2 border-base-300 rounded-lg p-1 bg-white shadow-md">
  {#if editor}
    {#if bold}
      <button type="button"
              class="p-2 text-sm rounded-sm text-gray-700 hover:text-black hover:bg-gray-300 cursor-pointer {editor.isActive('bold')
          ? 'ring ring-gray-100 text-white rounded'
          : ''}"
              onclick={() => editor?.chain().focus().toggleBold().run()}
      >
        <Icon icon="ic:baseline-format-bold"/>
      </button>
    {/if}

    {#if italic}
      <button type="button"
              class="p-2 text-sm rounded-sm text-gray-700 hover:text-black hover:bg-gray-300 cursor-pointer {editor.isActive('italic')
          ? 'ring ring-gray-100 text-white rounded'
          : ''}"
              onclick={() => editor?.chain().focus().toggleItalic().run()}
      >
        <Icon icon="ic:baseline-format-italic"/>
      </button>
    {/if}

    {#if underline}
      <button type="button"
              class="p-2 text-sm rounded-sm text-gray-700 hover:text-black hover:bg-gray-300 cursor-pointer {editor.isActive('underline')
          ? 'ring ring-gray-100 text-white rounded'
          : ''}"
              onclick={() => editor?.chain().focus().toggleUnderline().run()}
      >
        <Icon icon="ic:baseline-format-underlined"/>
      </button>
    {/if}

    {#if link}
      <button type="button"
              class="p-2 text-sm rounded-sm text-gray-700 hover:text-black hover:bg-gray-300 cursor-pointer {editor.isActive('link')
          ? 'ring ring-gray-100 text-white rounded'
          : ''}"
              onclick={setLink}
      >
        <Icon icon="ic:baseline-link"/>
      </button>
    {/if}
  {/if}
</div>

<div bind:this={element}></div>
