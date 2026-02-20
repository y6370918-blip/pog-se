# 兵棋样式实现指南

本文档说明游戏如何显示单位棋子，以及如何正确替换或生成新样式。

---

## 一、显示原理

每个单位由 **两层** 共同作用：

1. **CSS 类**：决定用哪张雪碧图、显示雪碧图的哪一格
2. **雪碧图文件**：包含该国家/类型所有单位的正反两面图

单位元素的类名格式：`unit army army_ah army_ix_3` 或 `unit corps corps_ge corps_ix_2`。

- `army_ah` / `corps_ge` 等：选择雪碧图
- `army_ix_3` / `corps_ix_2`：选择雪碧图内的列
- `.reduced`：切换到第二行（损编面）

---

## 二、雪碧图规格（必须严格遵守）

### 陆军 (Army)

| 属性 | 值 |
|------|-----|
| 单格尺寸 | 45×45 像素 |
| 布局 | 横向多列 × 2 行 |
| 第 1 行 | 满编 (3-2-3 等) |
| 第 2 行 | 损编 (1-2-3 等) |

| 国家 | 文件名 | 雪碧图尺寸 | 列数 |
|------|--------|------------|------|
| AH | army_ah.webp | 405×90 | 9 |
| BE | army_be.webp | 45×90 | 1 |
| BR | army_br.webp | 360×90 | 8 |
| FR | army_fr.webp | 450×90 | 10 |
| GE | army_ge.webp | 675×90 | 15 |
| IT | army_it.webp | 225×90 | 5 |
| RU | army_ru.webp | 585×90 | 13 |
| SB | army_sb.webp | 90×90 | 2 |
| US | army_usa.webp | 90×90 | 2 |
| TU | army_tu.webp | 90×90 | 2 |

**background-position 规则**：第 i 列、第 j 行 → `left: -(i-1)*45px`, `top: -(j-1)*45px`

### 军 (Corps)

| 属性 | 值 |
|------|-----|
| 单格尺寸 | 36×36 像素 |
| 布局 | 横向多列 × 2 行 |
| 第 1 行 | 满编 |
| 第 2 行 | 损编 |

| 国家 | 雪碧图尺寸 | 列数 |
|------|------------|------|
| AH | 36×72 | 1 |
| BR | 216×72 | 6 |
| GE | 36×72 | 1 |
| … | … | … |

**background-position 规则**：第 i 列 → `left: -(i-1)*36px`，损编行 `top: -36px`

---

## 三、为何会出现“畸形”

1. **尺寸不符**  
   雪碧图宽高与 `images.css` 中的 `background-size` 不一致 → 格子错位，看起来像乱码。

2. **行列顺序错误**  
   第 1 行必须是满编，第 2 行必须是损编；列顺序要和 `army_ix_1`、`army_ix_2`… 一一对应。

3. **图片格式 / 路径不匹配**  
   - 游戏当前引用 `army_ah.jpg`（见 `images.css`）  
   - 若只替换了 `army_ah.webp` 但没改 CSS，实际仍会加载 `.jpg`  
   - 若改用 `.webp`，需要在 `images.css` 中改为 `army_ah.webp`

4. **图片编码异常**  
   色彩模式、透明通道、压缩异常等，也可能导致显示异常。

---

## 四、替换 AH 陆军的正确流程

1. **生成雪碧图**  
   - 尺寸：405×90  
   - 第 1 行：9 个满编单位（1–7、10、11 Army），每格 45×45  
   - 第 2 行：对应的 9 个损编单位

2. **保存文件**  
   - 若使用 WebP：保存为 `pieces/army_ah.webp`  
   - 若使用 JPG：保存为 `pieces/army_ah.jpg`

3. **修改 images.css**  
   - 当前为 `.army_ah { background-image: url(pieces/army_ah.jpg); }`  
   - 若使用 webp：改为 `url(pieces/army_ah.webp)`  
   - 建议加上缓存破坏参数：`url(pieces/army_ah.webp?v=1)`，每次更换图片时递增 `?v=` 的值

4. **强刷浏览器**  
   使用 Ctrl+Shift+R 避免缓存旧图。

---

## 五、参考原始雪碧图

- 打开 `info/pieces.html` 可在浏览器中查看所有雪碧图的原始样子。
- 用图片编辑器打开 `pieces/army_ah.webp` 或 `army_ah.jpg`，对照上述规格检查尺寸和行列顺序。
