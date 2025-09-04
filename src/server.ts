#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class MakeMCPServer {
  private server: Server;
  private makeWebhookUrl: string;

  constructor() {
    this.makeWebhookUrl = process.env.MAKE_WEBHOOK_URL || '';
    this.server = new Server(
      {
        name: 'make-automation-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // 列出可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'trigger_make_scenario',
            description: '触发Make.com scenario执行指定任务',
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  description: '要执行的动作类型',
                  enum: ['create_task', 'send_notification', 'process_data', 'custom']
                },
                data: {
                  type: 'object',
                  description: '传递给scenario的数据',
                  additionalProperties: true
                }
              },
              required: ['action']
            }
          },
          {
            name: 'get_scenario_status',
            description: '获取Make.com scenario的执行状态',
            inputSchema: {
              type: 'object',
              properties: {
                execution_id: {
                  type: 'string',
                  description: 'scenario执行ID'
                }
              },
              required: ['execution_id']
            }
          },
          {
            name: 'test_webhook_connection',
            description: '测试与Make.com webhook的连接',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          }
        ]
      };
    });

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'trigger_make_scenario':
            return await this.triggerMakeScenario(args);
          case 'get_scenario_status':
            return await this.getScenarioStatus(args);
          case 'test_webhook_connection':
            return await this.testWebhookConnection();
          default:
            throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        throw new McpError(ErrorCode.InternalError, `工具执行失败: ${errorMessage}`);
      }
    });
  }

  private validatePayload(args: any) {
    const allowedActions = ['create_task', 'send_notification', 'process_data', 'custom'];
    if (!allowedActions.includes(args.action)) {
      throw new Error(`无效的动作类型: ${args.action}. 允许的类型: ${allowedActions.join(', ')}`);
    }
  }

  private async triggerMakeScenario(args: any) {
    if (!this.makeWebhookUrl) {
      throw new Error('Make.com webhook URL未配置。请在.env文件中设置MAKE_WEBHOOK_URL');
    }

    // 验证输入参数
    this.validatePayload(args);

    const payload = {
      action: args.action,
      data: args.data || {},
      timestamp: new Date().toISOString(),
      source: 'claude-mcp',
      request_id: `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    try {
      const response = await axios.post(this.makeWebhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Claude-MCP-Server/1.0.0'
        },
        timeout: 30000,
        validateStatus: (status) => status < 500 // 接受所有非5xx状态码
      });

      const executionId = response.data?.executionId || response.data?.id || 'N/A';
      const statusMessage = response.status >= 200 && response.status < 300 ? '✅ 成功' : '⚠️ 部分成功';

      return {
        content: [
          {
            type: 'text',
            text: `${statusMessage} Make scenario已触发\n` +
                  `动作类型: ${args.action}\n` +
                  `响应状态: ${response.status}\n` +
                  `执行ID: ${executionId}\n` +
                  `请求ID: ${payload.request_id}\n` +
                  `时间戳: ${payload.timestamp}`
          }
        ]
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 'N/A';
        const statusText = error.response?.statusText || 'Unknown';
        const errorData = error.response?.data || 'No additional error info';
        
        throw new Error(
          `HTTP请求失败: ${status} - ${statusText}\n` +
          `错误详情: ${JSON.stringify(errorData)}\n` +
          `请检查Make.com scenario状态和webhook配置`
        );
      }
      throw error;
    }
  }

  private async triggerMakeScenarioWithRetry(args: any, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.triggerMakeScenario(args);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        
        const delay = 1000 * Math.pow(2, i); // 指数退避
        console.error(`尝试 ${i + 1} 失败，${delay}ms后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private async getScenarioStatus(args: any) {
    // 这里可以调用Make.com API来获取执行状态
    // 需要配置Make.com API token
    return {
      content: [
        {
          type: 'text',
          text: `📊 Scenario状态查询\n` +
                `执行ID: ${args.execution_id}\n` +
                `状态: 此功能需要配置Make.com API访问权限\n` +
                `提示: 请访问Make.com dashboard查看详细执行状态`
        }
      ]
    };
  }

  private async testWebhookConnection() {
    if (!this.makeWebhookUrl) {
      return {
        content: [
          {
            type: 'text',
            text: '❌ Webhook URL未配置\n请在.env文件中设置MAKE_WEBHOOK_URL'
          }
        ]
      };
    }

    try {
      const testPayload = {
        action: 'test_connection',
        data: { test: true },
        timestamp: new Date().toISOString(),
        source: 'claude-mcp-test'
      };

      const response = await axios.post(this.makeWebhookUrl, testPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Webhook连接测试成功\n` +
                  `响应状态: ${response.status}\n` +
                  `响应时间: ${new Date().toISOString()}\n` +
                  `Make.com scenario可以正常接收数据`
          }
        ]
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ Webhook连接测试失败\n` +
                    `错误: ${error.response?.status} - ${error.response?.statusText}\n` +
                    `请检查:\n` +
                    `1. Webhook URL是否正确\n` +
                    `2. Make.com scenario是否已启用\n` +
                    `3. 网络连接是否正常`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `❌ 连接测试失败: ${error instanceof Error ? error.message : '未知错误'}`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Make MCP Server已启动');
    console.error(`📡 Webhook URL: ${this.makeWebhookUrl ? '已配置' : '未配置'}`);
  }
}

const server = new MakeMCPServer();
server.run().catch((error) => {
  console.error('❌ MCP Server启动失败:', error);
  process.exit(1);
});