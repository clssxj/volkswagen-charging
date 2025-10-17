# API接口文档

本文档详细说明大众充电地图应用的所有API接口。

## 📋 概述

- **基础URL**: `https://api.your-domain.com/api`
- **WebSocket URL**: `wss://api.your-domain.com/ws`
- **协议**: RESTful API + WebSocket
- **数据格式**: JSON
- **字符编码**: UTF-8

## 🔐 认证

所有需要认证的接口需要在请求头中携带token：

```
Authorization: Bearer <token>
```

## 📡 通用响应格式

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "错误描述",
  "data": null
}
```

### 状态码说明

| 状态码 | 说明 |
|-------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |
| 503 | 服务不可用 |

## 🗺️ 充电站相关接口

### 1. 获取充电站列表

获取指定区域内的充电站列表。

**请求**

```
GET /stations
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| minLat | number | 否 | 最小纬度 |
| maxLat | number | 否 | 最大纬度 |
| minLng | number | 否 | 最小经度 |
| maxLng | number | 否 | 最大经度 |
| status | string | 否 | 状态筛选：available/busy/offline/maintenance |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认50 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "station_1",
      "name": "北京商场中心充电站",
      "lat": 39.9042,
      "lng": 116.4074,
      "address": "北京市朝阳区中山路123号",
      "status": "available",
      "totalCount": 12,
      "availableCount": 8,
      "chargingCount": 3,
      "offlineCount": 1,
      "hasAC": true,
      "hasDC": true,
      "maxPower": 120,
      "pricePerKWh": "1.50",
      "serviceFee": "0.80",
      "operatorId": 1
    }
  ]
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | string | 充电站ID |
| name | string | 充电站名称 |
| lat | number | 纬度 |
| lng | number | 经度 |
| address | string | 详细地址 |
| status | string | 状态：available可用/busy繁忙/offline离线/maintenance维护中 |
| totalCount | number | 总充电桩数 |
| availableCount | number | 可用充电桩数 |
| chargingCount | number | 充电中数量 |
| offlineCount | number | 离线数量 |
| hasAC | boolean | 是否有交流桩 |
| hasDC | boolean | 是否有直流桩 |
| maxPower | number | 最大功率(kW) |
| pricePerKWh | string | 电价(元/度) |
| serviceFee | string | 服务费(元/度) |
| operatorId | number | 运营商ID |

---

### 2. 获取充电站详情

获取指定充电站的详细信息，包括所有充电桩的状态。

**请求**

```
GET /stations/:id
```

**路径参数**

| 参数 | 类型 | 说明 |
|-----|------|------|
| id | string | 充电站ID |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "station_1",
    "name": "北京商场中心充电站",
    "lat": 39.9042,
    "lng": 116.4074,
    "address": "北京市朝阳区中山路123号",
    "status": "available",
    "totalCount": 12,
    "availableCount": 8,
    "chargingCount": 3,
    "offlineCount": 1,
    "pricePerKWh": "1.50",
    "serviceFee": "0.80",
    "openTime": "00:00-24:00",
    "operatorName": "国家电网",
    "rating": 4.5,
    "reviewCount": 128,
    "facilities": ["停车场", "便利店", "休息区", "卫生间"],
    "chargers": [
      {
        "id": "station_1-charger-1",
        "number": "1号桩",
        "type": "DC",
        "power": 120,
        "status": "available",
        "voltage": 380,
        "current": 250
      }
    ]
  }
}
```

**chargers字段说明**

| 字段 | 类型 | 说明 |
|-----|------|------|
| id | string | 充电桩ID |
| number | string | 充电桩编号 |
| type | string | 类型：AC交流/DC直流 |
| power | number | 功率(kW) |
| status | string | 状态：available空闲/charging充电中/offline离线 |
| voltage | number | 电压(V) |
| current | number | 电流(A) |

---

### 3. 搜索充电站

根据关键词搜索充电站。

**请求**

```
GET /stations/search
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| keyword | string | 是 | 搜索关键词 |
| lat | number | 否 | 当前纬度（用于计算距离） |
| lng | number | 否 | 当前经度（用于计算距离） |
| limit | number | 否 | 返回数量限制，默认10 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "station_1",
      "name": "北京商场中心充电站",
      "address": "北京市朝阳区中山路123号",
      "lat": 39.9042,
      "lng": 116.4074,
      "distance": 1.5,
      "availableCount": 8,
      "totalCount": 12
    }
  ]
}
```

---

## ⚡ 充电相关接口

### 4. 开始充电

发起充电请求。

**请求**

```
POST /charging/start
```

**请求体**

```json
{
  "stationId": "station_1",
  "chargerId": "station_1-charger-1"
}
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "ORDER_1697520000000",
    "stationId": "station_1",
    "chargerId": "station_1-charger-1",
    "startTime": "2024-10-17T10:30:00.000Z",
    "status": "charging"
  }
}
```

---

### 5. 停止充电

停止正在进行的充电。

**请求**

```
POST /charging/stop
```

**请求体**

```json
{
  "orderId": "ORDER_1697520000000"
}
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "ORDER_1697520000000",
    "endTime": "2024-10-17T12:00:00.000Z",
    "status": "completed",
    "duration": 5400,
    "energy": 45.5,
    "amount": 104.65
  }
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|-----|------|------|
| duration | number | 充电时长(秒) |
| energy | number | 充电量(kWh) |
| amount | number | 费用(元) |

---

### 6. 获取充电状态

获取当前充电的实时状态。

**请求**

```
GET /charging/:orderId
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "orderId": "ORDER_1697520000000",
    "status": "charging",
    "startTime": "2024-10-17T10:30:00.000Z",
    "duration": 1800,
    "energy": 25.5,
    "power": 51,
    "voltage": 380,
    "current": 134,
    "estimatedTime": 1200,
    "amount": 58.65
  }
}
```

**字段说明**

| 字段 | 类型 | 说明 |
|-----|------|------|
| power | number | 当前功率(kW) |
| voltage | number | 当前电压(V) |
| current | number | 当前电流(A) |
| estimatedTime | number | 预计剩余时间(秒) |

---

### 7. 获取充电历史

获取用户的充电历史记录。

**请求**

```
GET /charging/history
```

**查询参数**

| 参数 | 类型 | 必填 | 说明 |
|-----|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| status | string | 否 | 状态筛选：completed/cancelled/failed |
| startDate | string | 否 | 开始日期 YYYY-MM-DD |
| endDate | string | 否 | 结束日期 YYYY-MM-DD |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "ORDER_1697520000000",
        "stationName": "北京商场中心充电站",
        "startTime": "2024-10-17T10:30:00.000Z",
        "endTime": "2024-10-17T12:00:00.000Z",
        "duration": 5400,
        "energy": 45.5,
        "amount": 104.65,
        "status": "completed"
      }
    ],
    "total": 156,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 💰 支付相关接口

### 8. 创建支付订单

创建支付订单。

**请求**

```
POST /payment/create
```

**请求体**

```json
{
  "orderId": "ORDER_1697520000000",
  "paymentMethod": "wechat"
}
```

**参数说明**

| 参数 | 类型 | 说明 |
|-----|------|------|
| orderId | string | 充电订单ID |
| paymentMethod | string | 支付方式：wechat微信/alipay支付宝/unionpay银联 |

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "paymentId": "PAY_1697520000000",
    "orderId": "ORDER_1697520000000",
    "amount": 104.65,
    "status": "pending",
    "paymentUrl": "https://...",
    "qrCode": "data:image/png;base64,..."
  }
}
```

---

### 9. 查询支付状态

查询支付订单状态。

**请求**

```
GET /payment/:paymentId
```

**响应示例**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "paymentId": "PAY_1697520000000",
    "orderId": "ORDER_1697520000000",
    "status": "paid",
    "amount": 104.65,
    "paidTime": "2024-10-17T12:05:00.000Z"
  }
}
```

**status说明**

- `pending`: 待支付
- `paid`: 已支付
- `cancelled`: 已取消
- `failed`: 支付失败
- `refunded`: 已退款

---

## 🔌 WebSocket接口

### 连接

```
wss://api.your-domain.com/ws
```

### 心跳机制

客户端每30秒发送一次心跳：

```json
{
  "type": "heartbeat",
  "timestamp": 1697520000000
}
```

服务端响应：

```json
{
  "type": "heartbeat",
  "timestamp": 1697520000000
}
```

### 订阅充电站状态

客户端发送：

```json
{
  "type": "subscribe",
  "payload": {
    "stationIds": ["station_1", "station_2"]
  }
}
```

### 取消订阅

客户端发送：

```json
{
  "type": "unsubscribe",
  "payload": {
    "stationIds": ["station_1"]
  }
}
```

### 状态更新推送

服务端推送充电站状态更新：

```json
{
  "type": "station_status_update",
  "payload": {
    "updates": [
      {
        "id": "station_1",
        "status": "available",
        "availableCount": 9,
        "chargingCount": 2,
        "offlineCount": 1
      }
    ]
  }
}
```

### 充电状态推送

充电过程中推送实时数据：

```json
{
  "type": "charging_status_update",
  "payload": {
    "orderId": "ORDER_1697520000000",
    "duration": 1800,
    "energy": 25.5,
    "power": 51,
    "amount": 58.65
  }
}
```

---

## 📊 错误码对照表

| 错误码 | 说明 | 处理建议 |
|-------|------|---------|
| 1001 | 充电站不存在 | 检查stationId |
| 1002 | 充电桩不可用 | 选择其他充电桩 |
| 1003 | 充电桩已被占用 | 刷新状态后重试 |
| 2001 | 订单不存在 | 检查orderId |
| 2002 | 订单状态异常 | 联系客服 |
| 3001 | 支付失败 | 重试或更换支付方式 |
| 3002 | 余额不足 | 充值后重试 |
| 4001 | 参数错误 | 检查请求参数 |
| 5001 | 服务器错误 | 稍后重试 |

---

## 🧪 测试环境

### 测试地址

- API: `https://staging-api.your-domain.com/api`
- WebSocket: `wss://staging-api.your-domain.com/ws`

### 测试账号

```
用户名: test@example.com
密码: test123456
```

### Postman集合

导入Postman集合文件：[下载链接]

---

## 📝 更新日志

### v1.0.0 (2024-10-17)

- 初始版本发布
- 支持所有基础功能

---

**文档维护**: 技术团队  
**最后更新**: 2024-10-17

