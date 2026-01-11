<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed, shallowRef } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import type { Extension } from '@tiptap/core';
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Minus, Undo, Redo, Link as LinkIcon, Image as ImageIcon,
  Heading1, Heading2, Heading3, Highlighter, Code2,
} from 'lucide-vue-next';

const lowlight = createLowlight(common);

const props = defineProps<{
  modelValue?: string;
  placeholder?: string;
  editable?: boolean;
  collaborationExtensions?: Extension[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'blur': [];
}>();

const linkUrl = ref('');
const showLinkInput = ref(false);

const baseExtensions = [
  StarterKit.configure({
    codeBlock: false,
    // history: props.collaborationExtensions?.length ? false : undefined,
  }),
  Placeholder.configure({
    placeholder: props.placeholder || '开始输入内容...',
  }),
  // Link.configure({ openOnClick: false }),
  Image.configure({ inline: true, allowBase64: true }),
  TextStyle,
  Color,
  Highlight.configure({ multicolor: true }),
  CodeBlockLowlight.configure({ lowlight }),
];

const editor = shallowRef<Editor | undefined>(undefined);

function createEditor() {
  if (editor.value) {
    editor.value.destroy();
  }

  // When using collaboration, don't set initial content - it comes from Yjs
  const hasCollab = props.collaborationExtensions && props.collaborationExtensions.length > 0;
  const initialContent = hasCollab ? '' : (props.modelValue || '');

  editor.value = new Editor({
    content: initialContent,
    extensions: baseExtensions,
    editable: props.editable !== false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => {
      emit('update:modelValue', editor.getHTML());
    },
    onBlur: () => {
      emit('blur');
    },
  });
}

// Initialize editor
createEditor();

// Recreate editor when collaboration extensions change
watch(() => props.collaborationExtensions, (newExtensions, oldExtensions) => {
  const hadCollab = oldExtensions && oldExtensions.length > 0;
  const hasCollab = newExtensions && newExtensions.length > 0;

  // Only recreate if collaboration state actually changed
  if (hadCollab !== hasCollab) {
    // Use nextTick to ensure extensions are fully initialized
    setTimeout(() => createEditor(), 0);
  }
});

watch(() => props.modelValue, (newValue) => {
  // Don't update content when using collaboration - Yjs handles sync
  const hasCollab = props.collaborationExtensions && props.collaborationExtensions.length > 0;
  if (editor.value && !hasCollab && newValue !== editor.value.getHTML()) {
    editor.value.commands.setContent(newValue || '');
  }
});

watch(() => props.editable, (newValue) => {
  if (editor.value) {
    editor.value.setEditable(newValue !== false);
  }
});

function setLink() {
  if (linkUrl.value) {
    editor.value?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value }).run();
  } else {
    editor.value?.chain().focus().unsetLink().run();
  }
  showLinkInput.value = false;
  linkUrl.value = '';
}

function addImage() {
  const url = window.prompt('输入图片 URL');
  if (url) {
    editor.value?.chain().focus().setImage({ src: url }).run();
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>

<template>
  <div class="border border-base-300 rounded-lg overflow-hidden bg-base-100">
    <!-- Toolbar -->
    <div v-if="editable !== false" class="flex flex-wrap gap-1 p-2 border-b border-base-300 bg-base-200">
      <!-- History -->
      <template v-if="!collaborationExtensions?.length">
        <button class="btn btn-ghost btn-xs" :disabled="!editor?.can().undo()" @click="editor?.chain().focus().undo().run()">
          <Undo class="w-4 h-4" />
        </button>
        <button class="btn btn-ghost btn-xs" :disabled="!editor?.can().redo()" @click="editor?.chain().focus().redo().run()">
          <Redo class="w-4 h-4" />
        </button>
        <div class="divider divider-horizontal mx-1"></div>
      </template>

      <!-- Headings -->
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('heading', { level: 1 }) }" @click="editor?.chain().focus().toggleHeading({ level: 1 }).run()">
        <Heading1 class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('heading', { level: 2 }) }" @click="editor?.chain().focus().toggleHeading({ level: 2 }).run()">
        <Heading2 class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('heading', { level: 3 }) }" @click="editor?.chain().focus().toggleHeading({ level: 3 }).run()">
        <Heading3 class="w-4 h-4" />
      </button>

      <div class="divider divider-horizontal mx-1"></div>

      <!-- Text Formatting -->
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('bold') }" @click="editor?.chain().focus().toggleBold().run()">
        <Bold class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('italic') }" @click="editor?.chain().focus().toggleItalic().run()">
        <Italic class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('strike') }" @click="editor?.chain().focus().toggleStrike().run()">
        <Strikethrough class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('code') }" @click="editor?.chain().focus().toggleCode().run()">
        <Code class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('highlight') }" @click="editor?.chain().focus().toggleHighlight({ color: '#fef08a' }).run()">
        <Highlighter class="w-4 h-4" />
      </button>

      <div class="divider divider-horizontal mx-1"></div>

      <!-- Lists -->
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('bulletList') }" @click="editor?.chain().focus().toggleBulletList().run()">
        <List class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('orderedList') }" @click="editor?.chain().focus().toggleOrderedList().run()">
        <ListOrdered class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('blockquote') }" @click="editor?.chain().focus().toggleBlockquote().run()">
        <Quote class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('codeBlock') }" @click="editor?.chain().focus().toggleCodeBlock().run()">
        <Code2 class="w-4 h-4" />
      </button>
      <button class="btn btn-ghost btn-xs" @click="editor?.chain().focus().setHorizontalRule().run()">
        <Minus class="w-4 h-4" />
      </button>

      <div class="divider divider-horizontal mx-1"></div>

      <!-- Link & Image -->
      <div class="dropdown">
        <button tabindex="0" class="btn btn-ghost btn-xs" :class="{ 'btn-active': editor?.isActive('link') }">
          <LinkIcon class="w-4 h-4" />
        </button>
        <div tabindex="0" class="dropdown-content z-[1] card card-compact w-64 p-2 shadow bg-base-100">
          <div class="card-body">
            <input v-model="linkUrl" type="url" placeholder="输入链接 URL" class="input input-bordered input-sm w-full" @keydown.enter="setLink" />
            <button class="btn btn-primary btn-sm" @click="setLink">确定</button>
          </div>
        </div>
      </div>
      <button class="btn btn-ghost btn-xs" @click="addImage">
        <ImageIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor Content -->
    <EditorContent :editor="editor" />
  </div>
</template>

<style>
.tiptap {
  outline: none;
}
.tiptap p.is-editor-empty:first-child::before {
  color: oklch(var(--bc) / 0.4);
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
</style>
