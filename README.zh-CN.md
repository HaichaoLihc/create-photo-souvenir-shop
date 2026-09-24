# 照片纪念品店

[English](README.md) · **简体中文**

把一组个人照片变成可以漫游、拿起礼品端详的 **3D 纪念品店**。这个 Codex Skill 包含完整的照片查看流程、艺术方向、照片衍生礼品设计，以及原生 JavaScript + Three.js 网页模板。

## 能做什么

- 用大幅联系表逐张查看照片，记录来源和可辨认的记忆元素。
- 支持明信片、冰箱贴、钥匙链、桌垫、杯子、杯垫、帆布袋、徽章、贴纸、手账十类礼品。
- 主墙可陈列最多 100 幅不同作品；默认至少 70% 陈列物品与提供的照片有关。
- 包含暖色木质陈列、深橄榄色墙面、120 件悬挂纸饰、键盘与触摸移动、物件旋转缩放。
- 可添加照片主题匹配的立体造物、自定义轮廓，以及保留原封面的翻页画册。画册放在左侧书架，点击打开 2D 阅读界面。

仓库示例使用 **24 幅虚构几何 SVG 图案**，没有个人照片或照片衍生的位图作品。Skill 自带运行模板，可以独立安装。

## 安装

```bash
python3 ~/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py \
  --repo HaichaoLihc/create-photo-souvenir-shop \
  --path skills/create-photo-souvenir-shop \
  --ref main
```

也可以把 [`skills/create-photo-souvenir-shop/`](skills/create-photo-souvenir-shop/) 复制到本地技能目录，按所在应用的要求重新加载技能。

## 使用

```text
用 $create-photo-souvenir-shop 查看 /path/to/photos 里的所有照片，
做一个属于这些照片的 3D 纪念品店。先看完照片，再设计风格化明信片、
有创意的钥匙链、杯子、冰箱贴和徽章。
```

图片生成由 Agent 调用当前可用的图像工具完成；Python 构建脚本负责整理素材和生成网站。也可以使用已有的设计成品。网站运行不需要 API key、数据库、CDN 或构建工具，默认只在本地预览。

详细说明：[Skill](skills/create-photo-souvenir-shop/SKILL.md) · [设计方向](skills/create-photo-souvenir-shop/references/art-direction.md) · [素材清单格式](skills/create-photo-souvenir-shop/references/collection-schema.md) · [运行代码说明](skills/create-photo-souvenir-shop/references/runtime.md)。

## 本地预览

在仓库根目录执行：

```bash
python3 -m http.server 4173 --bind 127.0.0.1 \
  --directory skills/create-photo-souvenir-shop/assets/html
```

打开 `http://127.0.0.1:4173/`。WASD 移动，拖动环顾，点击礼品拿起，Esc 放回。如果已有项目占用 4173，请换一个端口。

## 验证

需要 Python 3.10+、Pillow 和 Node.js 22+。HEIC 输入使用 `pillow-heif`，或 macOS 自带的 `sips`。

```bash
python3 -m pip install -r requirements.txt
python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/souvenir-reader.test.mjs
node skills/create-photo-souvenir-shop/scripts/validate_shop.mjs
```

测试覆盖联系表分页、照片方向、裁图、不同素材规模、可选画册和立体礼品、来源关联、几何、拾取与实例优化。自动检查不能替代对生成作品的审美判断和浏览器交互检查。

## 授权

代码及原创几何 SVG 示例使用 [MIT License](LICENSE)。Three.js 保留[原 MIT 声明](skills/create-photo-souvenir-shop/assets/html/assets/THREE-LICENSE.txt)。用户提供的照片和艺术作品保留各自的权利归属，不适用仓库代码的授权条款。
