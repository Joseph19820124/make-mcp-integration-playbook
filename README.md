# Make.com到MCP Server集成Playbook

## 概述
本playbook将指导你如何将Make.com scenario转换为MCP (Model Context Protocol) server，并与Claude Desktop集成，实现自动化工作流。

## 前置条件
- Make.com账户（免费版即可开始）
- Node.js 18+ 环境
- Claude Desktop应用
- 基础的JavaScript/TypeScript知识

## 步骤1：在Make.com创建基础Scenario

### 1.1 登录Make.com并创建新scenario
```
1. 访问 make.com 并登录
2. 点击 "Create a new scenario"
3. 选择 "Webhooks" 作为触发器
4. 配置 "Custom Webhook"
```

### 1.2 配置Webhook触发器
```
1. 点击webhook模块
2. 点击 "Add" 创建新webhook
3. 复制生成的webhook URL（稍后需要）
4. 设置webhook名称，如 "MCP-Trigger"
```

### 1.3 添加处理模块
根据你的需求添加处理模块，例如：
- **数据处理**：Filter, Router, Data store操作
- **外部服务**：Google Sheets, Notion, Slack等
- **HTTP请求**：调用其他API
- **响应格式化**：Webhook Response模块

### 示例scenario结构：
```
Webhook → Filter → HTTP Request → Webhook Response
```

## 步骤2：创建MCP Server

### 2.1 初始化项目
```bash
mkdir make-mcp-server
cd make-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk axios dotenv
npm install -D typescript @types/node
```

### 2.2 创建TypeScript配置
参见 `tsconfig.json` 文件

### 2.3 创建MCP Server代码
参见 `src/server.ts` 文件

### 2.4 创建环境配置
复制 `.env.example` 为 `.env` 并填入你的配置：
```env
MAKE_WEBHOOK_URL=你的Make.com_webhook_URL
MAKE_API_TOKEN=你的Make.com_API_token（可选）
```

### 2.5 构建和运行
```bash
npm run build
npm start
```

## 步骤3：配置Claude Desktop

### 3.1 编译并测试MCP Server
```bash
npm run build
chmod +x dist/server.js
```

### 3.2 配置Claude Desktop MCP
打开Claude Desktop配置文件：
- **macOS**: `~/Library/Application\ Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

添加MCP server配置：
```json
{
  "mcpServers": {
    "make-automation": {
      "command": "node",
      "args": ["/path/to/your/make-mcp-server/dist/server.js"],
      "env": {
        "MAKE_WEBHOOK_URL": "你的webhook_URL"
      }
    }
  }
}
```

### 3.3 重启Claude Desktop
重启Claude Desktop应用以加载新的MCP server配置。

## 步骤4：测试集成

### 4.1 在Claude Desktop中测试
```
你好Claude，请帮我触发Make scenario来创建一个任务，数据是：
{
  "title": "测试任务",
  "priority": "high",
  "due_date": "2025-01-15"
}
```

### 4.2 验证Make.com执行
1. 检查Make.com dashboard中的执行历史
2. 确认数据已正确传递
3. 验证后续处理模块是否正常工作

## 高级配置

### 错误处理和重试机制
参见 `src/server.ts` 中的实现示例

### 数据验证
参见 `src/server.ts` 中的 `validatePayload` 方法

### 日志记录
可以集成 winston 或其他日志库来记录详细的执行日志

## 常见用例示例

### 用例1：自动化数据处理
**Make.com流程**: Webhook → 数据验证 → Google Sheets更新 → Slack通知

### 用例2：任务管理集成
**Make.com流程**: Webhook → Notion数据库创建 → 团队成员邮件通知

### 用例3：内容发布工作流
**Make.com流程**: Webhook → 内容格式化 → 多平台发布 → 分析报告

## 故障排除

### 常见问题
1. **MCP Server连接失败**
   - 检查文件路径和权限
   - 确认Node.js版本兼容性

2. **Webhook调用失败**
   - 验证webhook URL正确性
   - 检查Make.com scenario状态

3. **数据传递问题**
   - 确认JSON格式正确
   - 检查Make.com数据映射

### 调试技巧
```bash
# 启用详细日志
DEBUG=* node dist/server.js

# 测试webhook连通性
curl -X POST -H "Content-Type: application/json" -d '{"test":true}' YOUR_WEBHOOK_URL
```

## 项目结构
```
make-mcp-server/
├── src/
│   └── server.ts          # MCP服务器主代码
├── dist/                  # 编译输出目录
├── package.json           # 项目配置
├── tsconfig.json         # TypeScript配置
├── .env.example          # 环境变量示例
├── .gitignore            # Git忽略文件
└── README.md             # 项目文档
```

## 扩展功能

- 添加更多Make.com API集成
- 实现batch操作支持
- 添加webhook验证机制
- 集成更多第三方服务

## 贡献

欢迎提交Issue和Pull Request来改进这个项目！

## 许可证

MIT License

---

通过这个playbook，你现在可以将Make.com的强大自动化能力直接整合到Claude Desktop的工作流中，实现seamless的AI驱动自动化！