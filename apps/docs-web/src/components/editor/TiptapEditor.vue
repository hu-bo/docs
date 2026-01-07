<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { useEditor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { common, createLowlight } from 'lowlight';
import type { JSONContent, Editor, AnyExtension } from '@tiptap/core';
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  LinkOutlined,
  PictureOutlined,
  HighlightOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons-vue';
import { Tooltip, Dropdown, Menu, Input, Modal } from 'ant-design-vue';

// 创建 lowlight 实例
const lowlight = createLowlight(common);

interface Props {
  modelValue?: JSONContent;
  readonly?: boolean;
  placeholder?: string;
  extensions?: AnyExtension[];
}

interface Emits {
  (e: 'update:modelValue', value: JSONContent): void;
  (e: 'ready', editor: Editor): void;
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  placeholder: '开始编写内容...',
  extensions: () => [],
});

const emit = defineEmits<Emits>();

// 链接弹窗
const linkModalVisible = ref(false);
const linkUrl = ref('');

// 图片弹窗
const imageModalVisible = ref(false);
const imageUrl = ref('');

// 创建编辑器
const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: [
    StarterKit.configure({
      codeBlock: false,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    Image,
    Highlight.configure({
      multicolor: true,
    }),
    CodeBlockLowlight.configure({
      lowlight,
    }),
    TextStyle,
    Color,
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    // 合并外部传入的扩展（如协作扩展）
    ...props.extensions,
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getJSON());
  },
  onCreate: ({ editor }) => {
    emit('ready', editor);
  },
});

// 监听外部内容变化
watch(
  () => props.modelValue,
  (newContent) => {
    if (editor.value && newContent) {
      const currentContent = JSON.stringify(editor.value.getJSON());
      const newContentStr = JSON.stringify(newContent);

      if (currentContent !== newContentStr) {
        editor.value.commands.setContent(newContent, { emitUpdate: false });
      }
    }
  },
  { deep: true }
);

// 监听只读状态变化
watch(
  () => props.readonly,
  (readonly) => {
    editor.value?.setEditable(!readonly);
  }
);

// 工具栏按钮状态
const isActive = (name: string, attrs?: Record<string, unknown>) => {
  return editor.value?.isActive(name, attrs) ?? false;
};

// 设置标题
const setHeading = (level: number) => {
  if (level === 0) {
    editor.value?.chain().focus().setParagraph().run();
  } else {
    editor.value?.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
  }
};

// 添加链接
const openLinkModal = () => {
  const previousUrl = editor.value?.getAttributes('link').href || '';
  linkUrl.value = previousUrl;
  linkModalVisible.value = true;
};

const confirmLink = () => {
  if (linkUrl.value) {
    editor.value
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl.value })
      .run();
  } else {
    editor.value?.chain().focus().unsetLink().run();
  }
  linkModalVisible.value = false;
  linkUrl.value = '';
};

// 添加图片
const openImageModal = () => {
  imageUrl.value = '';
  imageModalVisible.value = true;
};

const confirmImage = () => {
  if (imageUrl.value) {
    editor.value?.chain().focus().setImage({ src: imageUrl.value }).run();
  }
  imageModalVisible.value = false;
  imageUrl.value = '';
};

// 标题菜单项
const headingItems = [
  { key: '0', label: '正文' },
  { key: '1', label: '标题 1' },
  { key: '2', label: '标题 2' },
  { key: '3', label: '标题 3' },
];

onBeforeUnmount(() => {
  editor.value?.destroy();
});

// 暴露编辑器实例
defineExpose({
  editor,
});
</script>

<template>
  <div class="tiptap-editor">
    <!-- 工具栏 -->
    <div v-if="!readonly && editor" class="editor-toolbar">
      <!-- 标题选择 -->
      <div class="toolbar-group">
        <Dropdown :trigger="['click']">
          <button class="toolbar-btn heading-btn" type="button">
            {{ editor.isActive('heading', { level: 1 }) ? 'H1' :
               editor.isActive('heading', { level: 2 }) ? 'H2' :
               editor.isActive('heading', { level: 3 }) ? 'H3' : '正文' }}
          </button>
          <template #overlay>
            <Menu @click="({ key }) => setHeading(Number(key))">
              <Menu.Item v-for="item in headingItems" :key="item.key">
                {{ item.label }}
              </Menu.Item>
            </Menu>
          </template>
        </Dropdown>
      </div>

      <!-- 文本格式 -->
      <div class="toolbar-group">
        <Tooltip title="粗体">
          <button
            class="toolbar-btn"
            :class="{ 'is-active': isActive('bold') }"
            type="button"
            @click="editor?.chain().focus().toggleBold().run()"
          >
            <BoldOutlined />
          </button>
        </Tooltip>
        <Tooltip title="斜体">
          <button
            class="toolbar-btn"
            :class="{ 'is-active': isActive('italic') }"
            type="button"
            @click="editor?.chain().focus().toggleItalic().run()"
          >
            <ItalicOutlined />
          </button>
        </Tooltip>
        <Tooltip title="删除线">
          <button
            class="toolbar-btn"
            :class="{ 'is-active': isActive('strike') }"
            type="button"
            @click="editor?.chain().focus().toggleStrike().run()"
          >
            <StrikethroughOutlined />
          </button>
        </Tooltip>
        <Tooltip title="高亮">
          <button
            class="toolbar-btn"
            :class="{ 'is-active': isActive('highlight') }"
            type="button"
            @click="editor?.chain().focus().toggleHighlight().run()"
          >
            <HighlightOutlined />
          </button>
        </Tooltip>
      </div>

      <!-- 列表 -->
      <div class="toolbar-group">
        <Tooltip title="无序列表">
          <button
            class="toolbar-btn"
            :class="{ 'is-active': isActive('bulletList') }"
            type="button"
            @click="editor?.chain().focus().toggleBulletList().run()"
          >
            <UnorderedListOutlined />
          </button>
        </Tooltip>
        <Tooltip title="有序列表">
          <button
            class="toolbar-btn"
            :class="{ 'is-active': isActive('orderedList') }"
            type="button"
            @click="editor?.chain().focus().toggleOrderedList().run()"
          >
            <OrderedListOutlined />
          </button>
        </Tooltip>
      </div>

      <!-- 代码和链接 -->
      <div class="toolbar-group">
        <Tooltip title="行内代码">
          <button
            class="toolbar-btn"
            :class="{ 'is-active': isActive('code') }"
            type="button"
            @click="editor?.chain().focus().toggleCode().run()"
          >
            <CodeOutlined />
          </button>
        </Tooltip>
        <Tooltip title="代码块">
          <button
            class="toolbar-btn"
            :class="{ 'is-active': isActive('codeBlock') }"
            type="button"
            @click="editor?.chain().focus().toggleCodeBlock().run()"
          >
            <span style="font-family: monospace; font-size: 12px;">{}</span>
          </button>
        </Tooltip>
        <Tooltip title="链接">
          <button
            class="toolbar-btn"
            :class="{ 'is-active': isActive('link') }"
            type="button"
            @click="openLinkModal"
          >
            <LinkOutlined />
          </button>
        </Tooltip>
        <Tooltip title="图片">
          <button
            class="toolbar-btn"
            type="button"
            @click="openImageModal"
          >
            <PictureOutlined />
          </button>
        </Tooltip>
      </div>

      <!-- 撤销/重做 -->
      <div class="toolbar-group">
        <Tooltip title="撤销">
          <button
            class="toolbar-btn"
            type="button"
            :disabled="!editor?.can().undo()"
            @click="editor?.chain().focus().undo().run()"
          >
            <UndoOutlined />
          </button>
        </Tooltip>
        <Tooltip title="重做">
          <button
            class="toolbar-btn"
            type="button"
            :disabled="!editor?.can().redo()"
            @click="editor?.chain().focus().redo().run()"
          >
            <RedoOutlined />
          </button>
        </Tooltip>
      </div>
    </div>

    <!-- 编辑器内容区 -->
    <div class="editor-content">
      <EditorContent :editor="editor" />
    </div>

    <!-- 链接弹窗 -->
    <Modal
      v-model:open="linkModalVisible"
      title="插入链接"
      @ok="confirmLink"
    >
      <Input
        v-model:value="linkUrl"
        placeholder="请输入链接地址"
        @pressEnter="confirmLink"
      />
    </Modal>

    <!-- 图片弹窗 -->
    <Modal
      v-model:open="imageModalVisible"
      title="插入图片"
      @ok="confirmImage"
    >
      <Input
        v-model:value="imageUrl"
        placeholder="请输入图片地址"
        @pressEnter="confirmImage"
      />
    </Modal>
  </div>
</template>

<style lang="less" scoped>
@import '@/styles/tiptap-editor.less';

.heading-btn {
  width: auto !important;
  padding: 0 8px;
  font-size: 12px;
}
</style>
