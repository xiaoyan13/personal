/**
 * 让“单独出现”的图片居中显示，且不影响其它元素。
 *
 * ────────────────────────────────────────────────────────────
 * 什么叫“单独出现”（standalone）？
 * ────────────────────────────────────────────────────────────
 * 1. Markdown 图片  ![alt](url)
 *    当它所在的“段落”里，除了图片本身（以及图片之间的空白、换行）之外，
 *    没有任何其它内容（没有文字、链接、其它元素）时，才算单独出现。
 *      ✔ 会处理：    ![](a.png)
 *      ✔ 会处理：    ![](a.png)            （同段落多张纯图片也算）
 *                    ![](b.png)
 *      ✘ 不处理：    这是图片 ![](a.png)   （同段落里还有文字）
 *
 * 2. HTML 图片  <img ... />
 *    当用户把 <img> 作为“独立的块级 HTML”书写——即它自成一行、被 markdown-it
 *    解析为一个 html_block，并且这个块里**只有这一个 <img> 标签**、没有被
 *    <div> 等其它元素包裹时，才算单独出现。
 *      ✔ 会处理：    <img src="a.png" />
 *      ✘ 不处理：    <div><img src="a.png" /></div>   （被 div 包裹）
 *      ✘ 不处理：    文字 <img src="a.png"/> 文字       （行内夹在文字中间）
 *
 * 实现方式：用一个 core ruler 扫描 token 流，**直接在符合条件的 <img> 上追加
 * 居中样式**（不套外层 div、不加 class），其余 token 一律保持不变。
 *
 * 居中用的 CSS：VitePress 主题把 <img> 渲染成块级元素，块级元素靠
 * `margin: auto` 居中（text-align 无效）。这里显式声明 display: block，
 * 即使图片本是行内元素也能正常居中。!important 用于盖过主题自带的 margin。
 */
const CENTER_CSS =
  "display: block !important; margin-left: auto !important; margin-right: auto !important;";

export function centerStandaloneImages(md) {
  md.core.ruler.push("center_standalone_images", (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // —— 情况一：Markdown 图片 ![](url) ——
      // markdown-it 会把它放进段落：paragraph_open -> inline -> paragraph_close
      // 所以图片信息保存在 inline token 的 children 里。
      if (
        token.type === "inline" &&
        i > 0 &&
        tokens[i - 1].type === "paragraph_open"
      ) {
        if (isStandaloneImageInline(token)) {
          centerImagesInInline(token);
        }
        continue;
      }

      // —— 情况二：用户手写的块级 <img> ——
      // 自成一行的 HTML 会被解析成 html_block，内容就是这段原始 HTML 文本。
      if (token.type === "html_block" && isStandaloneImgHtml(token.content)) {
        token.content = injectImgStyle(token.content.trim());
      }
    }
  });
}

/**
 * 给一个“只含图片”的 inline token 里的每一张图片追加居中样式。
 * - image 类型：通过 attr 合并 style
 * - html_inline 的 <img>：直接改写其 HTML 文本
 */
function centerImagesInInline(inlineToken) {
  for (const child of inlineToken.children) {
    if (child.type === "image") {
      const existing = child.attrGet("style");
      child.attrSet("style", mergeStyle(existing));
    } else if (child.type === "html_inline" && isSingleImgTag(child.content)) {
      child.content = injectImgStyle(child.content.trim());
    }
  }
}

/**
 * 判断一个 inline token 是否“只包含图片”。
 * 允许的子节点：image、纯空白 text、软/硬换行；
 * 出现任何其它内容（文字、链接、非 img 的行内 HTML 等）即判定为“非单独出现”。
 */
function isStandaloneImageInline(inlineToken) {
  const children = inlineToken.children || [];
  let imageCount = 0;

  for (const child of children) {
    if (child.type === "image") {
      imageCount++;
    } else if (child.type === "html_inline" && isSingleImgTag(child.content)) {
      // 少数情况下手写的 <img> 会落在段落里成为 html_inline，同样视作图片
      imageCount++;
    } else if (child.type === "softbreak" || child.type === "hardbreak") {
      // 图片之间的换行，忽略
    } else if (child.type === "text" && child.content.trim() === "") {
      // 纯空白文本，忽略
    } else {
      return false;
    }
  }

  return imageCount > 0;
}

/**
 * 判断一段 html_block 文本是否“只有一个 <img> 标签”。
 * 用于区分单独的 <img> 与被 <div> 等包裹的 <img>。
 */
function isStandaloneImgHtml(content) {
  return isSingleImgTag(content.trim());
}

/** 整段文本恰好是单个 <img ...> 标签（自闭合或不自闭合均可），前后无其它内容。 */
function isSingleImgTag(text) {
  return /^<img\b[^>]*>$/i.test(text);
}

/** 把居中 CSS 合并进已有的 style 值（可能为 null）。 */
function mergeStyle(existing) {
  const prev = (existing || "").trim();
  if (!prev) return CENTER_CSS;
  return prev.endsWith(";") ? `${prev} ${CENTER_CSS}` : `${prev}; ${CENTER_CSS}`;
}

/**
 * 把居中样式直接写进一个 <img> 标签字符串。
 * - 已有 style 属性：把居中 CSS 追加到原值后面，保留原有样式（如 zoom）
 * - 没有 style 属性：在标签结尾插入一个新的 style 属性，兼容 `>` 与 `/>`
 */
function injectImgStyle(tag) {
  const styleAttr = /style\s*=\s*"([^"]*)"|style\s*=\s*'([^']*)'/i;

  if (styleAttr.test(tag)) {
    return tag.replace(styleAttr, (_m, dq, sq) => {
      const isDouble = dq !== undefined;
      const quote = isDouble ? '"' : "'";
      const value = mergeStyle(isDouble ? dq : sq);
      return `style=${quote}${value}${quote}`;
    });
  }

  // 没有 style 属性：在结尾的 `>` 或 `/>` 之前插入
  return tag.replace(/\s*(\/?)>$/, (_m, slash) =>
    slash ? ` style="${CENTER_CSS}" />` : ` style="${CENTER_CSS}">`
  );
}
