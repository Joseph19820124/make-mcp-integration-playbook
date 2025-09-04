# Make.com Scenario配置示例

## 基础Webhook接收器配置

### 1. 任务管理集成示例
**流程**: Webhook → Filter → Notion → Slack通知

```json
// Webhook接收的数据格式
{
  "action": "create_task",
  "data": {
    "title": "新任务标题",
    "description": "任务描述",
    "priority": "high",
    "assignee": "john@example.com",
    "due_date": "2025-01-15"
  },
  "timestamp": "2025-01-01T12:00:00.000Z",
  "source": "claude-mcp"
}
```

**Make.com模块配置**:
1. **Webhook** - 接收Claude的请求
2. **Filter** - 检查 `action === 'create_task'`
3. **Notion** - 创建数据库项目
4. **Slack** - 发送通知消息
5. **Webhook Response** - 返回执行结果

### 2. 数据处理示例
**流程**: Webhook → 数据转换 → Google Sheets → 邮件通知

```json
// Webhook接收的数据格式
{
  "action": "process_data",
  "data": {
    "source_data": [
      {"name": "产品A", "sales": 1000, "date": "2025-01-01"},
      {"name": "产品B", "sales": 1500, "date": "2025-01-01"}
    ],
    "report_type": "daily_summary"
  }
}
```

### 3. 通知发送示例
**流程**: Webhook → Router → 多平台发送

```json
// Webhook接收的数据格式
{
  "action": "send_notification",
  "data": {
    "message": "系统维护通知：今晚22:00-24:00进行系统升级",
    "channels": ["slack", "email", "sms"],
    "recipients": ["team@example.com", "+1234567890"],
    "priority": "urgent"
  }
}
```

## 高级配置技巧

### 1. 错误处理
在每个关键模块后添加错误处理路径：
- 使用 "Error handler" 模块
- 配置重试机制
- 发送错误通知

### 2. 数据验证
在Webhook后添加过滤器：
```javascript
// Filter条件示例
get("action"; "unknown") != "unknown" AND
length(get("data")) > 0
```

### 3. 响应格式化
配置Webhook Response返回标准格式：
```json
{
  "success": true,
  "executionId": "{{execution.id}}",
  "timestamp": "{{now}}",
  "message": "任务已成功处理"
}
```

### 4. 安全性考虑
- 启用webhook验证
- 设置IP白名单
- 使用HTTPS端点
- 实现请求签名验证

## 常用模块配置

### Google Sheets集成
- **操作**: Add a row
- **映射**: 将webhook数据映射到表格列
- **错误处理**: 配置重试和错误日志

### Notion集成
- **数据库选择**: 选择目标数据库
- **属性映射**: 配置字段对应关系
- **关系处理**: 处理关联数据

### Slack集成
- **频道选择**: 配置目标频道
- **消息格式**: 使用Markdown格式
- **用户提及**: 动态@相关用户

### 邮件发送
- **模板配置**: 创建邮件模板
- **收件人管理**: 支持动态收件人列表
- **附件处理**: 支持动态生成附件

## 测试和调试

### 1. 使用Make.com内置测试
- 点击每个模块的"Run this module once"
- 检查数据流和转换结果
- 验证外部服务连接

### 2. Webhook测试
```bash
# 使用curl测试webhook
curl -X POST \
  'https://hook.eu1.make.com/your-webhook-id' \
  -H 'Content-Type: application/json' \
  -d '{
    "action": "test",
    "data": {"test": true}
  }'
```

### 3. 日志监控
- 查看执行历史
- 分析错误日志
- 监控执行时间和成功率