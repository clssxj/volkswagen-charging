# 高德地图API配置指南

## ⚠️ 重要提示

您遇到的错误 `INVALID_USER_SCODE` 表示高德地图API Key配置不正确。请按以下步骤配置。

## 📝 配置步骤

### 1. 获取高德地图Key

1. **访问高德开放平台**
   - 网址：https://console.amap.com/
   - 点击"注册/登录"

2. **创建应用**
   - 登录后，点击"应用管理" → "我的应用"
   - 点击"创建新应用"
   - 填写应用名称：如"大众充电地图"
   - 提交创建

3. **添加Key**
   - 在您创建的应用下，点击"添加Key"
   - 选择服务平台：**Web端(JS API)**
   - Key名称：如"充电地图WebKey"
   - 提交

4. **复制Key**
   - 创建成功后，您会看到一个Key（一长串字符）
   - 复制这个Key

### 2. 配置到项目

在项目根目录创建 `.env` 文件（如果已存在则编辑）：

```env
# 必填：将下面的 your_amap_key_here 替换为你刚才复制的Key
VITE_AMAP_KEY=your_amap_key_here

# 可选：如果提示需要安全密钥，再配置这个
# VITE_AMAP_SECURITY_CODE=your_security_code_here
```

**示例**（实际的Key会更长）：
```env
VITE_AMAP_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

### 3. 配置安全密钥（如果需要）

如果您的账号开启了"数字签名认证"或"IP白名单"，还需要配置安全密钥：

1. **获取安全密钥**
   - 在高德控制台，应用管理页面
   - 找到"Web端(JS API)"安全密钥
   - 点击"生成"或查看现有密钥

2. **配置到 .env**
   ```env
   VITE_AMAP_KEY=你的Key
   VITE_AMAP_SECURITY_CODE=你的安全密钥
   ```

### 4. 重启开发服务器

配置完成后，必须重启开发服务器：

```bash
# Windows PowerShell
# 按 Ctrl+C 停止当前服务器
# 然后重新启动
npm run dev
```

### 5. 验证配置

打开浏览器控制台（F12），应该看到：
- ✅ 没有 "INVALID_USER_SCODE" 错误
- ✅ 地图正常加载
- ✅ 定位功能正常
- ✅ 路线规划成功

## 🔍 常见问题

### Q1: 我配置了Key，还是报错怎么办？

**检查清单**：
- ✅ Key是否正确复制（没有多余空格）
- ✅ 选择的是"Web端(JS API)"类型的Key
- ✅ .env 文件保存了吗
- ✅ 重启开发服务器了吗

### Q2: 提示"额度不足"或"请求次数超限"

**原因**：免费额度用完了

**解决方案**：
- 高德地图每天有一定免费额度
- 等到第二天重置，或者购买更多额度
- 开发阶段可以使用Mock数据：
  ```env
  VITE_USE_MOCK=true
  ```

### Q3: 如何使用Mock数据跳过API限制？

在 `.env` 文件中设置：

```env
VITE_USE_MOCK=true
```

这样就会使用本地模拟数据，不需要调用高德地图API。

**注意**：Mock模式下，路线规划功能将无法使用，因为路线规划必须调用真实API。

### Q4: 报错"SERVICE_NOT_AVAILABLE"

**原因**：该Key没有开通路线规划服务

**解决方案**：
1. 在高德控制台检查Key的服务权限
2. 确保勾选了"路径规划"服务
3. 或者重新创建一个Key，选择所有服务

### Q5: 报错"INVALID_USER_IP"

**原因**：IP白名单限制

**解决方案**：
1. 在高德控制台，Key设置中找到"IP白名单"
2. 添加您的IP地址，或设置为 `0.0.0.0/0` （允许所有IP，仅开发环境）

## 📋 完整的 .env 示例

```env
# ========================================
# 高德地图配置
# ========================================

# Web服务 API Key（必填）
VITE_AMAP_KEY=your_amap_key_here

# 安全密钥（如果开启了安全验证则必填）
# VITE_AMAP_SECURITY_CODE=your_security_code_here


# ========================================
# 其他配置（可选）
# ========================================

# WebSocket服务地址
VITE_WS_URL=ws://localhost:8080/ws

# 是否使用Mock数据
VITE_USE_MOCK=true
```

## 🎯 验证配置是否成功

配置完成并重启服务器后，在浏览器控制台执行：

```javascript
// 检查Key是否加载
console.log('AMAP_KEY:', import.meta.env.VITE_AMAP_KEY)

// 测试路线规划
const testRoute = async () => {
  const amapService = (await import('./src/services/amap.js')).default
  try {
    const route = await amapService.getDrivingRoute(
      { lat: 31.8206, lng: 117.2272 },  // 起点
      { lat: 31.8639, lng: 117.2808 }   // 终点
    )
    console.log('路线规划成功！', route)
  } catch (error) {
    console.error('路线规划失败：', error.message)
  }
}
testRoute()
```

如果看到"路线规划成功！"，说明配置正确！✅

## 📞 获取帮助

如果按照以上步骤仍然无法解决问题：

1. **检查高德地图官方文档**
   - JS API文档：https://lbs.amap.com/api/jsapi-v2/summary
   - 常见错误码：https://lbs.amap.com/api/jsapi-v2/guide/abc/error-code

2. **查看错误码含义**
   - `INVALID_USER_SCODE`：Key无效或安全验证失败
   - `SERVICE_NOT_AVAILABLE`：服务未开通
   - `INVALID_USER_IP`：IP白名单限制
   - `OVER_QUOTA`：超出配额限制

3. **联系高德技术支持**
   - 工单系统：https://console.amap.com/dev/ticket

## 🚀 配置完成后

配置成功后，您可以：

- ✅ 使用导航功能
- ✅ 规划路线并查看详情
- ✅ 在地图上绘制路线
- ✅ 跳转到高德地图APP导航

祝您使用愉快！🎉

---

**文档更新日期**：2025-10-19

