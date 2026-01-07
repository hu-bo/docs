import * as Y from 'yjs';
import { logger } from '../utils/logger.js';
import * as strapiService from '../services/strapi.js';

// 文档名称格式: doc-{documentId}
function extractDocumentId(docName: string): string {
  return docName.replace('doc-', '');
}

/**
 * 从 Strapi 加载文档内容到 Yjs
 */
export async function loadDocumentContent(docName: string, ydoc: Y.Doc): Promise<void> {
  const documentId = extractDocumentId(docName);

  try {
    const result = await strapiService.getDocById(documentId);

    if (!result.data?.content) {
      logger.debug(`[Persistence] Document ${documentId} has no content`);
      return;
    }

    const content = result.data.content;
    let tiptapJson;

    // 检测内容格式
    if (content.startsWith('{') || content.startsWith('[')) {
      try {
        tiptapJson = JSON.parse(content);
        logger.debug(`[Persistence] Loaded JSON content for ${documentId}`);
      } catch {
        // 解析失败，当作 HTML 处理
        tiptapJson = htmlToTiptapJson(content);
        logger.debug(`[Persistence] Converted HTML to JSON for ${documentId}`);
      }
    } else {
      // HTML 内容
      tiptapJson = htmlToTiptapJson(content);
      logger.debug(`[Persistence] Converted HTML to JSON for ${documentId}`);
    }

    // 将 Tiptap JSON 转换为 Yjs 结构
    initYDocFromTiptapJson(ydoc, tiptapJson);

  } catch (error) {
    logger.error(`[Persistence] Failed to load document ${documentId}:`, error);
    throw error;
  }
}

/**
 * 将 Yjs 文档保存到 Strapi
 */
export async function saveDocumentContent(docName: string, ydoc: Y.Doc): Promise<void> {
  const documentId = extractDocumentId(docName);

  try {
    // 从 Yjs 提取 Tiptap JSON
    const tiptapJson = extractTiptapJsonFromYDoc(ydoc);

    if (!tiptapJson) {
      logger.debug(`[Persistence] No content to save for ${documentId}`);
      return;
    }

    // 保存到 Strapi
    await strapiService.updateDoc(documentId, {
      content: JSON.stringify(tiptapJson),
    });

    logger.info(`[Persistence] Saved document ${documentId}`);

  } catch (error) {
    logger.error(`[Persistence] Failed to save document ${documentId}:`, error);
    throw error;
  }
}

/**
 * 简单的 HTML 到 Tiptap JSON 转换
 * 注意：这是一个简化版本，复杂的 HTML 可能需要更完整的解析
 */
function htmlToTiptapJson(html: string): TiptapDoc {
  if (!html || html.trim() === '') {
    return {
      type: 'doc',
      content: [{ type: 'paragraph' }],
    };
  }

  // 简单处理：将 HTML 内容包装为一个带 HTML 的段落
  // 实际的转换会在前端使用 @tiptap/html 完成
  // 这里只是提供一个基础的 fallback
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: stripHtmlTags(html),
          },
        ],
      },
    ],
  };
}

/**
 * 去除 HTML 标签（简单实现）
 */
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .trim();
}

// Tiptap 文档类型定义
interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
}

interface TiptapDoc {
  type: 'doc';
  content: TiptapNode[];
}

/**
 * 将 Tiptap JSON 初始化到 Yjs 文档
 */
function initYDocFromTiptapJson(ydoc: Y.Doc, tiptapJson: TiptapDoc): void {
  const yXmlFragment = ydoc.getXmlFragment('default');

  // 清空现有内容
  while (yXmlFragment.length > 0) {
    yXmlFragment.delete(0, 1);
  }

  // 转换 Tiptap 节点到 Yjs XmlElement
  if (tiptapJson.content) {
    for (const node of tiptapJson.content) {
      const xmlElement = tiptapNodeToYXml(node);
      if (xmlElement) {
        yXmlFragment.push([xmlElement]);
      }
    }
  }
}

/**
 * 将 Tiptap 节点转换为 Yjs XmlElement
 */
function tiptapNodeToYXml(node: TiptapNode): Y.XmlElement | Y.XmlText | null {
  if (node.type === 'text') {
    const xmlText = new Y.XmlText();
    xmlText.insert(0, node.text || '');

    // 处理 marks（格式）
    if (node.marks && node.marks.length > 0) {
      const attrs: Record<string, unknown> = {};
      for (const mark of node.marks) {
        attrs[mark.type] = mark.attrs || true;
      }
      xmlText.format(0, xmlText.length, attrs);
    }

    return xmlText;
  }

  const xmlElement = new Y.XmlElement(node.type);

  // 设置属性
  if (node.attrs) {
    for (const [key, value] of Object.entries(node.attrs)) {
      if (value !== undefined && value !== null) {
        xmlElement.setAttribute(key, value as any);
      }
    }
  }

  // 递归处理子节点
  if (node.content) {
    for (const child of node.content) {
      const childXml = tiptapNodeToYXml(child);
      if (childXml) {
        xmlElement.push([childXml]);
      }
    }
  }

  return xmlElement;
}

/**
 * 从 Yjs 文档提取 Tiptap JSON
 */
function extractTiptapJsonFromYDoc(ydoc: Y.Doc): TiptapDoc | null {
  const yXmlFragment = ydoc.getXmlFragment('default');

  if (yXmlFragment.length === 0) {
    return null;
  }

  const content: TiptapNode[] = [];

  for (let i = 0; i < yXmlFragment.length; i++) {
    const element = yXmlFragment.get(i);
    const node = yXmlToTiptapNode(element);
    if (node) {
      content.push(node);
    }
  }

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  };
}

/**
 * 将 Yjs XmlElement 转换为 Tiptap 节点
 */
function yXmlToTiptapNode(element: Y.XmlElement | Y.XmlText | Y.AbstractType<unknown>): TiptapNode | null {
  if (element instanceof Y.XmlText) {
    const text = element.toString();
    if (!text) return null;

    const node: TiptapNode = {
      type: 'text',
      text,
    };

    // 提取格式信息
    // 注意：这里简化处理，实际可能需要更复杂的 delta 解析
    return node;
  }

  if (element instanceof Y.XmlElement) {
    const node: TiptapNode = {
      type: element.nodeName,
    };

    // 提取属性
    const attrs = element.getAttributes();
    if (Object.keys(attrs).length > 0) {
      node.attrs = attrs;
    }

    // 递归处理子节点
    if (element.length > 0) {
      const content: TiptapNode[] = [];
      for (let i = 0; i < element.length; i++) {
        const child = element.get(i);
        const childNode = yXmlToTiptapNode(child);
        if (childNode) {
          content.push(childNode);
        }
      }
      if (content.length > 0) {
        node.content = content;
      }
    }

    return node;
  }

  return null;
}
