# 部署指南

本文档详细说明如何部署大众充电地图应用到生产环境。

## 📋 部署前准备

### 1. 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 支持HTTPS的Web服务器（Nginx/Apache）
- 域名（用于PWA和定位功能）

### 2. 获取高德地图API Key

1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册并登录账号
3. 进入控制台 -> 应用管理 -> 我的应用
4. 创建新应用，选择"Web端(JS API)"
5. 配置域名白名单
6. 获取 API Key

### 3. 配置环境变量

创建 `.env.production` 文件：

```env
# 高德地图API Key
VITE_AMAP_KEY=your_production_amap_key

# 生产环境API地址
VITE_API_BASE_URL=https://api.your-domain.com/api

# WebSocket地址
VITE_WS_URL=wss://api.your-domain.com/ws

# 关闭Mock模式
VITE_USE_MOCK=false
```

## 🏗️ 构建生产版本

### 方式一：本地构建

```bash
# 安装依赖
npm install

# 构建生产版本
npm run build

# 预览构建结果（可选）
npm run preview
```

构建产物位于 `dist/` 目录。

### 方式二：Docker构建

创建 `Dockerfile`:

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# 运行阶段
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

构建镜像：

```bash
docker build -t volkswagen-charging-map:latest .
```

## 🚀 部署方式

### 方式一：Nginx部署

#### 1. 安装Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 2. 配置Nginx

创建配置文件 `/etc/nginx/sites-available/charging-map`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书配置
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 网站根目录
    root /var/www/charging-map;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # 浏览器缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker不缓存
    location = /sw.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理（可选）
    location /api/ {
        proxy_pass http://backend-server:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket代理（可选）
    location /ws {
        proxy_pass http://backend-server:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

#### 3. 启用配置并重启

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/charging-map /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

#### 4. 上传文件

```bash
# 将构建产物上传到服务器
scp -r dist/* user@your-server:/var/www/charging-map/
```

### 方式二：Docker部署

```bash
# 运行容器
docker run -d \
  --name charging-map \
  -p 80:80 \
  -p 443:443 \
  -v /path/to/ssl:/etc/nginx/ssl \
  volkswagen-charging-map:latest

# 查看日志
docker logs -f charging-map
```

### 方式三：静态托管服务

#### Vercel部署

1. 安装Vercel CLI

```bash
npm install -g vercel
```

2. 部署

```bash
vercel --prod
```

#### Netlify部署

1. 在项目根目录创建 `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

2. 连接GitHub仓库并自动部署

## 🔒 HTTPS配置

### 使用Let's Encrypt免费证书

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

## 📊 监控与日志

### 1. 错误监控

集成Sentry（可选）：

```javascript
// src/main.js
import * as Sentry from '@sentry/vue'

Sentry.init({
  app,
  dsn: 'YOUR_SENTRY_DSN',
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0
})
```

### 2. 访问日志

Nginx日志位置：
- 访问日志：`/var/log/nginx/access.log`
- 错误日志：`/var/log/nginx/error.log`

### 3. 性能监控

使用Google Analytics或自建监控系统。

## 🔄 持续集成/持续部署（CI/CD）

### GitLab CI配置

已包含 `.gitlab-ci.yml` 文件，配置以下环境变量：

- `SSH_PRIVATE_KEY`: SSH私钥
- `STAGING_SERVER`: 测试服务器地址
- `PRODUCTION_SERVER`: 生产服务器地址

### GitHub Actions配置

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_AMAP_KEY: ${{ secrets.AMAP_KEY }}
          
      - name: Deploy to Server
        uses: easingthemes/ssh-deploy@main
        env:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          SOURCE: "dist/"
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: "/var/www/charging-map/"
```

## 🧪 部署后验证

### 1. 功能测试

- [ ] 地图正常加载
- [ ] 充电站标记显示
- [ ] 定位功能正常
- [ ] 搜索功能正常
- [ ] 详情页面正常
- [ ] 导航功能正常
- [ ] PWA安装提示

### 2. 性能测试

使用Lighthouse进行评分：

```bash
npm install -g lighthouse
lighthouse https://your-domain.com --view
```

目标评分：
- Performance: >90
- Accessibility: 100
- Best Practices: >95
- SEO: 100
- PWA: 100

### 3. 兼容性测试

在以下浏览器测试：
- Chrome (iOS/Android)
- Safari (iOS)
- 微信浏览器
- 支付宝浏览器

## 🐛 常见问题

### 1. 地图不显示

**原因**：API Key配置错误或域名未授权

**解决**：
- 检查 `.env.production` 中的API Key
- 在高德平台配置域名白名单

### 2. PWA无法安装

**原因**：未使用HTTPS或manifest配置错误

**解决**：
- 确保使用HTTPS
- 检查 `/pwa-*.png` 图标文件存在

### 3. 定位失败

**原因**：HTTP环境不支持定位API

**解决**：
- 必须使用HTTPS
- 检查浏览器定位权限

### 4. WebSocket连接失败

**原因**：代理配置错误或后端服务未启动

**解决**：
- 检查Nginx WebSocket代理配置
- 确认后端服务正常运行
- 临时启用Mock模式测试前端

## 📝 维护建议

### 日常维护

1. **定期备份**：备份数据和配置文件
2. **监控日志**：定期检查错误日志
3. **更新依赖**：定期更新npm包（注意兼容性）
4. **性能优化**：根据监控数据优化性能

### 更新流程

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
npm install

# 3. 构建
npm run build

# 4. 备份当前版本
cp -r /var/www/charging-map /var/www/charging-map.backup

# 5. 部署新版本
rsync -av dist/ /var/www/charging-map/

# 6. 重启服务（如需要）
sudo systemctl reload nginx
```

## 🔐 安全建议

1. **使用HTTPS**：所有生产环境必须使用HTTPS
2. **API Key保护**：不要将API Key提交到公开仓库
3. **定期更新**：及时更新依赖包修复安全漏洞
4. **访问限制**：配置防火墙规则限制访问
5. **备份策略**：定期备份数据和配置

## 📞 技术支持

如有部署问题，请：

1. 查看项目README.md的故障排查章节
2. 检查Nginx错误日志
3. 查看浏览器控制台错误信息
4. 提交Issue到项目仓库

---

**最后更新**: 2025-10-17

