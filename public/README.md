# 公共资源目录

此目录包含应用的静态资源文件。

## 📁 目录结构

```
public/
├── favicon.ico              # 网站图标
├── apple-touch-icon.png     # iOS添加到主屏幕图标
├── pwa-192x192.png          # PWA图标 (192x192)
├── pwa-512x512.png          # PWA图标 (512x512)
├── mask-icon.svg            # Safari固定标签图标
└── robots.txt               # 搜索引擎爬虫配置
```

## 🎨 图标要求

### favicon.ico
- 尺寸: 16x16, 32x32, 48x48
- 格式: ICO
- 用途: 浏览器标签页图标

### apple-touch-icon.png
- 尺寸: 180x180
- 格式: PNG
- 用途: iOS设备添加到主屏幕时的图标

### PWA图标
- pwa-192x192.png: 192x192 (必需)
- pwa-512x512.png: 512x512 (必需)
- 格式: PNG
- 用途: PWA应用图标

### mask-icon.svg
- 格式: SVG
- 要求: 单色矢量图
- 用途: Safari固定标签图标

## 📝 robots.txt

搜索引擎爬虫配置文件，示例：

```
User-agent: *
Allow: /

Sitemap: https://your-domain.com/sitemap.xml
```

## 🔧 使用说明

1. **替换图标**
   - 使用工具生成各尺寸图标（推荐：https://realfavicongenerator.net/）
   - 替换public目录下的对应文件

2. **更新manifest**
   - 图标路径在 `vite.config.js` 的 PWA 配置中定义
   - 修改后需要重新构建

3. **注意事项**
   - 图标文件名不要随意修改
   - 确保图标清晰可见
   - 测试不同设备的显示效果

## 🎨 设计建议

- 使用大众品牌色 (#001e50)
- 图标简洁明了，识别度高
- 适配深色/浅色背景
- 避免过多细节（小尺寸看不清）

## 🔍 在线工具

- **Favicon生成器**: https://realfavicongenerator.net/
- **图标压缩**: https://tinypng.com/
- **SVG优化**: https://jakearchibald.github.io/svgomg/

