# HTTPS配置说明

## 🔒 为什么需要HTTPS？

现代浏览器（Chrome、Edge、Safari等）出于安全考虑，**仅在HTTPS环境下允许使用定位API**（Geolocation API）。

如果使用HTTP协议，浏览器会拒绝定位请求，导致：
- ❌ 定位失败
- ❌ 自动降级到默认位置（北京）
- ⚠️ 控制台显示权限错误

因此，为了正常使用定位功能，**必须使用HTTPS协议**。

---

## ✅ 已完成配置

项目已配置好HTTPS，使用自签名证书进行本地开发。

### 📁 证书位置

```
项目根目录/
└── certs/
    ├── localhost-key.pem  (私钥)
    └── localhost.pem      (证书)
```

### ⚙️ 配置文件

**vite.config.js** 已配置HTTPS：

```javascript
import fs from 'node:fs'
import path from 'node:path'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const httpsConfig = {
  key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem')),
  cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.pem'))
}

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    https: httpsConfig,  // ← 启用HTTPS
    // ...
  }
})
```

---

## 🚀 启动HTTPS服务

### 1. 启动开发服务器

```bash
npm run dev
```

服务器将在HTTPS模式下启动：

```
VITE v5.4.8  ready in 500 ms

➜  Local:   https://localhost:3000/
➜  Network: https://192.168.x.x:3000/
```

### 2. 访问应用

在浏览器中访问：
- **本机**: https://localhost:3000
- **局域网**: https://192.168.x.x:3000

---

## ⚠️ 浏览器证书警告

由于使用的是**自签名证书**，浏览器会显示安全警告：

### Chrome浏览器

1. 会显示"您的连接不是私密连接"
2. 点击"高级"
3. 点击"继续前往 localhost（不安全）"

### Edge浏览器

1. 会显示"您的连接不是私密连接"
2. 点击"高级"
3. 点击"继续访问此网站（不推荐）"

### Firefox浏览器

1. 会显示"警告：潜在的安全风险"
2. 点击"高级"
3. 点击"接受风险并继续"

### Safari浏览器

1. 会显示"此连接不是私密连接"
2. 点击"显示详细信息"
3. 点击"访问此网站"

**注意**：这些警告是正常的，因为证书是自己签发的，不是由受信任的CA机构签发。在开发环境中可以安全地忽略。

---

## 📱 移动端测试

### 在手机上访问

1. **确保手机和电脑在同一局域网**
2. **访问Network地址**：https://192.168.x.x:3000
3. **接受证书警告**（各浏览器略有不同）
4. **允许定位权限**

### iOS Safari

1. 访问地址后会显示证书警告
2. 点击"显示详细信息" → "访问此网站"
3. 首次访问时会询问定位权限，选择"允许"

### Android Chrome

1. 访问地址后会显示"您的连接不是私密连接"
2. 点击"高级" → "继续访问"
3. 首次访问时会询问定位权限，选择"允许"

### 微信浏览器

1. 点击右上角"..." → "在浏览器打开"
2. 在外部浏览器中接受证书并访问
3. 允许定位权限

---

## 🔐 信任证书（可选）

如果不想每次都看到证书警告，可以将证书添加到系统信任列表：

### Windows

1. 双击 `certs/localhost.pem`
2. 点击"安装证书"
3. 选择"本地计算机"
4. 选择"将所有的证书都放入下列存储" → "受信任的根证书颁发机构"
5. 完成安装
6. 重启浏览器

### macOS

```bash
sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain certs/localhost.pem
```

重启浏览器后证书警告将消失。

### Linux

```bash
sudo cp certs/localhost.pem /usr/local/share/ca-certificates/localhost.crt
sudo update-ca-certificates
```

---

## 🧪 验证HTTPS和定位

### 1. 检查协议

打开浏览器控制台（F12），在Console中输入：

```javascript
console.log(window.location.protocol)
// 应该输出: "https:"
```

### 2. 测试定位API

```javascript
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('定位成功:', pos),
  (err) => console.error('定位失败:', err)
)
```

如果HTTPS配置正确，应该会：
- ✅ 弹出定位权限请求
- ✅ 允许后成功获取位置
- ✅ 地图自动移动到当前位置

### 3. 查看Network标签

在开发者工具的Network标签中，所有请求应该显示为：
- 🔒 Protocol: https
- ✅ Status: 200

---

## 🔄 生成新证书（可选）

如果需要重新生成证书：

### 使用mkcert（推荐）

```bash
# 安装mkcert
# Windows (使用Chocolatey)
choco install mkcert

# macOS
brew install mkcert

# Linux
# 参考: https://github.com/FiloSottile/mkcert

# 生成证书
mkcert -install
mkcert localhost 127.0.0.1 ::1 192.168.x.x

# 移动证书到certs目录
mkdir -p certs
mv localhost+3-key.pem certs/localhost-key.pem
mv localhost+3.pem certs/localhost.pem
```

### 使用OpenSSL

```bash
# 生成私钥
openssl genrsa -out certs/localhost-key.pem 2048

# 生成证书
openssl req -new -x509 -sha256 -key certs/localhost-key.pem -out certs/localhost.pem -days 3650 \
  -subj "/C=CN/ST=Beijing/L=Beijing/O=Development/OU=Development/CN=localhost"
```

---

## 🌐 生产环境

### 真实域名部署

生产环境应使用真实的SSL证书：

1. **免费证书**：Let's Encrypt
   ```bash
   certbot certonly --standalone -d your-domain.com
   ```

2. **付费证书**：阿里云、腾讯云等

3. **CDN证书**：使用CDN服务（Cloudflare、阿里云CDN等）

### Nginx配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        root /var/www/charging-map;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 📝 常见问题

### Q1: 启动时报错 "ENOENT: no such file or directory"

**原因**: 找不到证书文件

**解决**: 
- 确认 `certs/` 文件夹存在
- 确认证书文件名正确
- 检查文件权限

### Q2: 定位仍然失败

**可能原因**:
1. 浏览器未允许定位权限
2. 证书警告未接受
3. 使用了HTTP而不是HTTPS

**解决**:
- 确认地址栏显示 🔒 图标
- 检查浏览器设置中的位置权限
- 清除浏览器缓存和站点数据

### Q3: 手机无法访问

**可能原因**:
1. 不在同一局域网
2. 防火墙阻止
3. 证书未接受

**解决**:
- 确认手机和电脑连接同一WiFi
- 关闭电脑防火墙或添加端口例外（3000）
- 在手机浏览器中接受证书警告

### Q4: WebSocket连接失败

**原因**: WebSocket也需要使用WSS（安全WebSocket）

**解决**: 更新WebSocket连接地址
```javascript
const wsUrl = 'wss://localhost:3000/ws'  // 使用wss://而不是ws://
```

---

## 📚 参考资料

- [MDN - Geolocation API](https://developer.mozilla.org/zh-CN/docs/Web/API/Geolocation_API)
- [Vite HTTPS配置](https://vitejs.dev/config/server-options.html#server-https)
- [mkcert - 本地HTTPS证书工具](https://github.com/FiloSottile/mkcert)
- [Let's Encrypt - 免费SSL证书](https://letsencrypt.org/)

---

## ✅ 检查清单

启动HTTPS服务后，请确认：

- [ ] 浏览器地址栏显示 🔒 图标
- [ ] 地址以 `https://` 开头
- [ ] 接受了证书警告
- [ ] 允许了定位权限
- [ ] 控制台没有定位相关错误
- [ ] 地图能正常定位到当前位置

---

**配置完成时间**: 2024-10-17  
**文档版本**: v1.0.0

