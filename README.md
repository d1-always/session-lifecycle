# session-lifecycle

一个现代化的 TypeScript/JavaScript 库，用于Web Client管理会话生命周期事件，提供智能的用户活动监控和会话状态管理。

## ✨ 主要特性

- 🚀 **智能会话管理** - 自动检测页面初始化、标签页切换、用户活动
- ⏱️ **定时心跳** - 30秒间隔的会话生命周期监控
- 👁️ **页面可见性检测** - 标签页切换时自动暂停/恢复会话
- 🎯 **用户活动监控** - 检测点击、滚动、移动等用户交互
- ⏰ **不活动检测** - 2分钟无活动自动结束会话
- 📊 **详细事件数据** - 包含时间戳、持续时间、事件类型等
- 🔧 **高度可配置** - 自定义心跳间隔、不活动超时等
- 💪 **TypeScript 完美支持** - 完整的类型定义和智能提示
- 🌐 **多平台兼容** - 支持 ES 模块、CommonJS 和 UMD 格式
- 📦 **轻量级** - 无外部依赖，压缩后仅 ~3KB

## 📦 包结构

```
session-lifecycle/
├── dist/                    # 构建输出目录
│   ├── cjs/                # CommonJS 模块
│   ├── esm/                # ES 模块  
│   ├── umd/                # UMD 格式 (浏览器)
│   └── types/              # TypeScript 类型定义
├── examples/               # 使用示例
│   ├── browser.html        # 交互式浏览器演示
│   ├── node.js             # Node.js 示例
│   └── typescript.ts       # TypeScript 示例
├── README.md               # 完整文档
└── package.json            # 包配置
```

## 安装

### npm/yarn/pnpm

```bash
npm install session-lifecycle
# 或
yarn add session-lifecycle
# 或
pnpm install session-lifecycle
```

### CDN (通过 script 标签)

```html
<!-- 开发版本 -->
<script src="https://unpkg.com/session-lifecycle/dist/umd/session-lifecycle.js"></script>

<!-- 生产版本 (压缩) -->
<script src="https://unpkg.com/session-lifecycle/dist/umd/session-lifecycle.min.js"></script>
```

## 🎯 工作原理

1. **初始化** - 页面加载后自动触发 `on_session_start` (type: 'init')
2. **心跳监控** - 每30秒触发 `on_session_life` 事件，报告会话持续时间
3. **页面隐藏** - 切换标签页时立即触发 `on_session_end` 并暂停监控
4. **页面恢复** - 切回标签页时触发 `on_session_start` (type: 'active') 并恢复监控
5. **不活动检测** - 2分钟无用户活动时自动触发 `on_session_end`
6. **活动恢复** - 用户再次活动时自动触发 `on_session_start` (type: 'active')

## 🚀 快速开始

### ES 模块 / TypeScript

```typescript
import createSessionLifecycle from 'session-lifecycle';

// 创建会话生命周期实例
const { on_session_start, on_session_end, on_session_life } = createSessionLifecycle({
  heartbeatInterval: 30000,  // 30秒心跳
  inactivityTimeout: 120000, // 2分钟不活动超时
  debug: true                // 启用调试日志
});
// 参数均为非必填

// 监听会话开始事件
on_session_start((data) => {
  console.log('会话开始！', {
    type: data.type,      // 'init' 或 'active'
    timestamp: data.timestamp
  });
});

// 监听会话结束事件
on_session_end((data) => {
  console.log('会话结束！', {
    duration: data.duration,        // 会话持续时间 (毫秒)
    total_duration: data.total_duration, // 总持续时间 (毫秒)
    timestamp: data.timestamp
  });
});

// 监听会话心跳事件
on_session_life((data) => {
  console.log('会话心跳', {
    duration: data.duration,        // 心跳间隔时间 (毫秒)
    total_duration: data.total_duration, // 会话总持续时间 (毫秒)
    timestamp: data.timestamp
  });
});
```

### CommonJS

```javascript
const createSessionLifecycle = require('session-lifecycle').default;

const { on_session_start, on_session_end, on_session_life } = createSessionLifecycle();

on_session_start((data) => {
  console.log(`会话开始！类型: ${data.type}, 时间: ${new Date(data.timestamp)}`);
});

on_session_end((data) => {
  const sessionDuration = Math.round(data.duration / 1000);
  const totalDuration = Math.round(data.total_duration / 1000);
  console.log(`会话结束！会话时长: ${sessionDuration}秒，总时长: ${totalDuration}秒`);
});

on_session_life((data) => {
  const intervalTime = Math.round(data.duration / 1000);
  const totalTime = Math.round(data.total_duration / 1000);
  console.log(`会话心跳 - 间隔: ${intervalTime}秒，总运行: ${totalTime}秒`);
});
```

### 浏览器 (script 标签)

```html
<script src="https://unpkg.com/session-lifecycle/dist/umd/session-lifecycle.min.js"></script>
<script>
  // 通过全局对象 SessionLifecycle 访问
  const { on_session_start, on_session_end, on_session_life } = SessionLifecycle.default();
  
  on_session_start(function(data) {
    console.log('会话开始！类型:', data.type);
    
    // 页面初始化 vs 用户重新激活
    if (data.type === 'init') {
      console.log('页面首次加载');
    } else if (data.type === 'active') {
      console.log('用户重新激活页面');
    }
  });
  
      on_session_end(function(data) {
      const sessionMinutes = Math.round(data.duration / 60000);
      const totalMinutes = Math.round(data.total_duration / 60000);
      console.log('会话结束！会话时长:', sessionMinutes, '分钟，总时长:', totalMinutes, '分钟');
    });
    
    on_session_life(function(data) {
      const intervalSeconds = Math.round(data.duration / 1000);
      const totalSeconds = Math.round(data.total_duration / 1000);
      console.log('心跳 - 间隔:', intervalSeconds, '秒，总运行:', totalSeconds, '秒');
    });
</script>
```

## 📚 API 参考

### createSessionLifecycle(config?)

工厂函数，创建会话生命周期实例并返回其方法。

**参数:**
```typescript
interface SessionLifecycleConfig {
  heartbeatInterval?: number;  // 心跳间隔，默认 30000ms (30秒)
  inactivityTimeout?: number;  // 不活动超时，默认 120000ms (2分钟)
  debug?: boolean;            // 调试模式，默认 false
}
```

**返回值:**
包含会话生命周期方法和清理函数的对象

### 🎣 事件方法

#### on_session_start(callback)
注册会话开始事件的回调函数

```typescript
on_session_start((data: SessionStartData) => void)

interface SessionStartData {
  type: 'init' | 'active';  // init: 页面初始化, active: 用户重新激活
  timestamp: number;         // 事件发生时间戳
}
```

#### on_session_end(callback)
注册会话结束事件的回调函数

```typescript
on_session_end((data: SessionEndData) => void)

interface SessionEndData {
  duration: number;         // 本次会话持续时间 (毫秒)
  total_duration: number;   // 总持续时间 (毫秒，对于end事件通常与duration相同)
  timestamp: number;        // 事件发生时间戳
}
```

#### on_session_life(callback)
注册会话心跳事件的回调函数（每30秒触发一次）

```typescript
on_session_life((data: SessionLifeData) => void)

interface SessionLifeData {
  duration: number;         // 心跳间隔时间 (毫秒，通常为30000ms)
  total_duration: number;   // 会话总持续时间 (毫秒，从session开始计算)
  timestamp: number;        // 事件发生时间戳
}
```

#### destroy()
清理资源，停止所有监听器和定时器

```typescript
destroy(): void
```

## 🛠️ 高级用法

### 配置选项

```typescript
const sessionMethods = createSessionLifecycle({
  heartbeatInterval: 15000,  // 15秒心跳（更频繁）
  inactivityTimeout: 300000, // 5分钟不活动超时
  debug: true                // 启用调试日志
});
```

### 资源清理

```typescript
const sessionMethods = createSessionLifecycle();
const { destroy } = sessionMethods;

// 页面卸载时清理资源
window.addEventListener('beforeunload', () => {
  destroy();
});
```

### 多实例使用

```typescript
// 不同配置的多个实例
const fastSession = createSessionLifecycle({ heartbeatInterval: 10000 });
const slowSession = createSessionLifecycle({ heartbeatInterval: 60000 });
```

## 💪 TypeScript 支持

完整的 TypeScript 类型定义，智能提示和类型检查：

```typescript
import createSessionLifecycle, { 
  SessionLifecycle,
  SessionStartHandler,
  SessionEndHandler, 
  SessionLifeHandler,
  SessionLifecycleMethods 
} from 'session-lifecycle';

// 强类型的事件处理器
const startHandler: SessionStartHandler = (data) => {
  if (data.type === 'init') {
    console.log('页面初始化会话');
  }
};

const methods: SessionLifecycleMethods = createSessionLifecycle();
methods.on_session_start(startHandler);
```

## 许可证

MIT

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 检查包内容 并 发布
npm pack --dry-run

# 如果还未登录npm
npm login

# 发布包
npm publish

# 发布成功后，用户就可以安装使用
npm install session-lifecycle

# 清理构建文件
npm run clean
```

构建将生成以下格式的文件：
- `dist/esm/` - ES 模块
- `dist/cjs/` - CommonJS 模块  
- `dist/umd/` - UMD 格式 (浏览器)
- `dist/types/` - TypeScript 类型定义
