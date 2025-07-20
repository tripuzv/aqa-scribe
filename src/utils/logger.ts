export class Logger {
  static info(message: string, ...args: any[]): void {
    console.log(`ℹ️  ${message}`, ...args);
  }

  static success(message: string, ...args: any[]): void {
    console.log(`✅ ${message}`, ...args);
  }

  static warning(message: string, ...args: any[]): void {
    console.warn(`⚠️  ${message}`, ...args);
  }

  static error(message: string, ...args: any[]): void {
    console.error(`❌ ${message}`, ...args);
  }

  static tool(toolName: string, args: any): void {
    console.log(`🔧 Executing: ${toolName} with args:`, args);
  }

  static toolResult(content: string): void {
    const truncated = content.length > 200 ? content.substring(0, 200) + '...' : content;
    console.log(`✅ Tool result: ${truncated}`);
  }

  static debug(message: string, ...args: any[]): void {
    if (process.env.DEBUG === 'true') {
      console.log(`🐛 ${message}`, ...args);
    }
  }
} 