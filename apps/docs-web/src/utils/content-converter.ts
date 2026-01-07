import { generateJSON, generateHTML } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { common, createLowlight } from 'lowlight';
import type { JSONContent } from '@tiptap/core';

// 创建 lowlight 实例用于代码高亮
const lowlight = createLowlight(common);

/**
 * 用于内容转换的扩展列表
 * 注意：这里不包含协作相关扩展，只用于内容序列化/反序列化
 */
export const contentExtensions = [
  StarterKit.configure({
    codeBlock: false, // 使用 CodeBlockLowlight 替代
  }),
  Link.configure({
    openOnClick: false,
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
    placeholder: '开始编写内容...',
  }),
];

/**
 * 检测内容格式
 */
export function detectContentFormat(content: string): 'html' | 'json' | 'empty' {
  if (!content || content.trim() === '') {
    return 'empty';
  }

  const trimmed = content.trim();

  // 尝试解析为 JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === 'doc') {
        return 'json';
      }
    } catch {
      // 解析失败，视为 HTML
    }
  }

  return 'html';
}

/**
 * 将 HTML 转换为 Tiptap JSON
 * 用于加载旧文档
 */
export function htmlToTiptapJSON(html: string): JSONContent {
  if (!html || html.trim() === '') {
    return createEmptyDoc();
  }

  try {
    return generateJSON(html, contentExtensions);
  } catch (error) {
    console.error('Failed to convert HTML to JSON:', error);
    return createEmptyDoc();
  }
}

/**
 * 将 Tiptap JSON 转换为 HTML
 * 用于文档预览页面
 */
export function tiptapJSONToHTML(json: JSONContent): string {
  try {
    return generateHTML(json, contentExtensions);
  } catch (error) {
    console.error('Failed to convert JSON to HTML:', error);
    return '';
  }
}

/**
 * 解析内容字符串
 * 自动检测格式并返回 Tiptap JSON
 */
export function parseContent(content: string): JSONContent {
  const format = detectContentFormat(content);

  switch (format) {
    case 'empty':
      return createEmptyDoc();

    case 'json':
      try {
        return JSON.parse(content);
      } catch {
        return createEmptyDoc();
      }

    case 'html':
      return htmlToTiptapJSON(content);

    default:
      return createEmptyDoc();
  }
}

/**
 * 序列化 Tiptap JSON 为字符串
 */
export function serializeContent(json: JSONContent): string {
  return JSON.stringify(json);
}

/**
 * 创建空文档
 */
export function createEmptyDoc(): JSONContent {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
      },
    ],
  };
}

/**
 * 检查文档是否为空
 */
export function isEmptyDoc(json: JSONContent): boolean {
  if (!json.content || json.content.length === 0) {
    return true;
  }

  // 只有一个空段落
  if (
    json.content.length === 1 &&
    json.content[0].type === 'paragraph' &&
    (!json.content[0].content || json.content[0].content.length === 0)
  ) {
    return true;
  }

  return false;
}
