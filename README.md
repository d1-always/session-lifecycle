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
- 🛡️ **单例模式** - 自动管理实例，防止冲突和内存泄漏
- ⚡ **异步销毁** - 确保回调完全执行后再创建新实例
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
npm install @d1-always/session-lifecycle
# 或
yarn add @d1-always/session-lifecycle
# 或
pnpm install @d1-always/session-lifecycle
```

### CDN (通过 script 标签)

```html
<!-- 开发版本 -->
<script src="https://unpkg.com/@d1-always/session-lifecycle/dist/umd/session-lifecycle.js"></script>

<!-- 生产版本 (压缩) -->
<script src="https://unpkg.com/@d1-always/session-lifecycle/dist/umd/session-lifecycle.min.js"></script>
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
import createSessionLifecycle from '@d1-always/session-lifecycle';

// 创建会话生命周期实例 (异步)
const { on_session_start, on_session_end, on_session_life, destroy } = await createSessionLifecycle({
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

// 清理资源时 (异步)
await destroy();
```

### CommonJS

```javascript
const createSessionLifecycle = require('@d1-always/session-lifecycle').default;

async function initSession() {
  const { on_session_start, on_session_end, on_session_life, destroy } = await createSessionLifecycle();

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

  // 清理资源时
  await destroy();
}

initSession().catch(console.error);
```

### 浏览器 (script 标签)

```html
<script src="https://unpkg.com/@d1-always/session-lifecycle/dist/umd/session-lifecycle.min.js"></script>
<script>
  async function initSession() {
    // 通过全局对象 SessionLifecycle 访问 (异步)
    const { on_session_start, on_session_end, on_session_life, destroy } = await SessionLifecycle.default();
  
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
    
    // 页面卸载时清理资源
    window.addEventListener('beforeunload', async () => {
      await destroy();
    });
  }
  
  initSession().catch(console.error);
</script>
```

### 同步版本 (向后兼容)

如果你不想处理异步，可以使用同步版本：

```javascript
import { createSessionLifecycleSync } from '@d1-always/session-lifecycle';

// 同步创建实例 (注意：销毁旧实例时不会等待回调完成)
const { on_session_start, on_session_end, on_session_life, destroy } = createSessionLifecycleSync({
  debug: true
});

// destroy 方法仍然返回 Promise
await destroy();
```

## 📚 API 参考

### createSessionLifecycle(config?)

异步工厂函数，创建会话生命周期实例并返回其方法。确保在创建新实例前完全清理旧实例。

**参数:**
```typescript
interface SessionLifecycleConfig {
  heartbeatInterval?: number;  // 心跳间隔，默认 30000ms (30秒)
  inactivityTimeout?: number;  // 不活动超时，默认 120000ms (2分钟)
  debug?: boolean;            // 调试模式，默认 false
}
```

**返回值:**
Promise，解析为包含会话生命周期方法和清理函数的对象

### createSessionLifecycleSync(config?)

同步版本的工厂函数，为了向后兼容而保留。**注意：** 销毁旧实例时不会等待回调完成。

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
异步清理资源，停止所有监听器和定时器，并等待所有回调完成

```typescript
destroy(): Promise<void>
```

## 🛠️ 高级用法

### 配置选项

```typescript
const sessionMethods = await createSessionLifecycle({
  heartbeatInterval: 15000,  // 15秒心跳（更频繁）
  inactivityTimeout: 300000, // 5分钟不活动超时
  debug: true                // 启用调试日志
});
```

### 资源清理

```typescript
const sessionMethods = await createSessionLifecycle();
const { destroy } = sessionMethods;

// 页面卸载时清理资源
window.addEventListener('beforeunload', async () => {
  await destroy();
});
```

### 单例模式

插件自动确保同一时间只有一个活跃实例，多次调用会自动清理旧实例：

```typescript
// 第一次创建
const session1 = await createSessionLifecycle({ heartbeatInterval: 10000 });

// 第二次创建会自动销毁 session1 (等待回调完成)
const session2 = await createSessionLifecycle({ heartbeatInterval: 60000 });

// 手动检查和管理实例
import { hasActiveSessionLifecycle, destroyCurrentSessionLifecycle } from '@d1-always/session-lifecycle';

if (hasActiveSessionLifecycle()) {
  console.log('已有活跃实例');
  await destroyCurrentSessionLifecycle(); // 手动销毁
}
```

## 📱 移动端兼容性

Session Lifecycle 已针对移动端浏览器进行了全面优化，支持 iOS Safari、Android Chrome 等主流移动浏览器。

### 🎯 移动端优化特性

#### **自动设备检测**
插件会自动检测设备类型并应用相应的优化策略：

```javascript
// 移动端自动优化配置
const session = await createSessionLifecycle(); // 自动检测并优化

// 移动端默认配置
{
  heartbeatInterval: 45000,  // 45秒（节省电量）
  inactivityTimeout: 180000  // 3分钟（移动端用户习惯）
}

// 桌面端默认配置  
{
  heartbeatInterval: 30000,  // 30秒
  inactivityTimeout: 120000  // 2分钟
}
```

#### **完整触摸事件支持**
```javascript
// 支持的移动端事件
- touchstart, touchmove, touchend, touchcancel  // 触摸事件
- gesturestart, gesturechange, gestureend        // iOS手势事件
- orientationchange                              // 设备旋转
- online/offline                                 // 网络状态
- pagehide/pageshow                             // 页面生命周期
- focus/blur                                     // 应用焦点
```

#### **保守恢复策略**
移动端使用更保守的会话恢复策略以适应移动浏览器的特殊行为：

```javascript
// 移动端阈值：至少60秒或2倍心跳间隔
// 桌面端阈值：心跳间隔（30秒）

// 移动端会等待用户活动后才完全恢复会话
// 桌面端会立即恢复会话
```

### 🔧 移动端特殊处理

#### **iOS Safari 优化**
- **定时器限制处理** - 后台时自动调整定时器策略
- **内存管理优化** - 更及时的资源清理
- **Page Visibility API兼容** - 多重生命周期事件检测

#### **Android 浏览器兼容**
- **厂商差异处理** - 适配不同厂商浏览器行为
- **省电模式适配** - 检测并适应省电模式影响
- **WebView 支持** - 在应用内 WebView 中正常工作

#### **网络状态监听**
```javascript
// 自动处理网络状态变化
session.on_session_end((data) => {
  if (data.reason === 'network_offline') {
    console.log('因网络断开而暂停会话');
  }
});

// 网络恢复时自动处理
// 插件会自动检测网络恢复并适当恢复会话
```

### 📋 移动端测试

提供专门的移动端测试页面：

```html
<!-- 移动端测试页面 -->
<script src="examples/mobile-test.html"></script>
```

**测试场景包括：**
- 🔄 **设备旋转** - 测试方向变化事件
- 📶 **网络切换** - WiFi/数据网络切换测试  
- 🔄 **应用切换** - 多任务切换测试
- 💤 **后台运行** - 长时间后台恢复测试
- 👆 **触摸手势** - 各种触摸操作测试

### ⚠️ 移动端注意事项

#### **生命周期差异**
```javascript
// 移动端页面生命周期更复杂
// 建议同时监听多个事件以确保完整性

session.on_session_end((data) => {
  // 移动端可能因为各种原因触发 session_end
  console.log('会话结束原因:', data.reason);
});
```

#### **性能考虑**
```javascript
// 移动端推荐配置
const mobileConfig = {
  heartbeatInterval: 60000,   // 更长的心跳间隔节省电量
  inactivityTimeout: 300000,  // 更宽松的超时设置
  debug: false                // 生产环境关闭调试减少性能开销
};
```

#### **网络不稳定处理**
```javascript
// 移动端网络经常不稳定，建议添加容错处理
session.on_session_end((data) => {
  if (data.reason === 'network_offline') {
    // 保存重要状态，准备网络恢复后重新连接
    localStorage.setItem('lastSessionData', JSON.stringify(data));
  }
});
```

### 🔍 移动端调试

启用调试模式查看移动端特有的日志：

```javascript
const session = await createSessionLifecycle({ debug: true });

// 移动端调试日志示例：
// [SessionLifecycle] Device detected: Mobile
// [SessionLifecycle] Mobile lifecycle listeners registered: 7 events
// [SessionLifecycle] Attempting to resume session after 65000ms pause (Mobile)
// [SessionLifecycle] Mobile device: waiting for user activity before full resume
```

## 🔄 异步支持与单例模式

### 为什么需要异步？

Session Lifecycle v1.0+ 引入了异步销毁机制，解决了以下关键问题：

1. **回调完整性** - 确保 `on_session_end` 回调完全执行后再创建新实例
2. **数据一致性** - 避免新旧实例的事件回调交错执行
3. **资源清理** - 保证所有定时器和事件监听器被正确清理

### 异步vs同步对比

```typescript
// ❌ 旧版本 - 可能的问题
const session1 = createSessionLifecycle();
const session2 = createSessionLifecycle(); // 可能在session1销毁前创建

// ✅ 新版本 - 安全的异步方式
const session1 = await createSessionLifecycle();
const session2 = await createSessionLifecycle(); // 等待session1完全销毁

// ⚠️ 向后兼容 - 同步版本 (不推荐)
const session = createSessionLifecycleSync(); // 不等待回调完成
```

### 单例模式优势

- **防止冲突** - 避免多个实例的事件监听器重复注册
- **内存优化** - 自动清理旧实例，防止内存泄漏
- **开发友好** - 热重载时自动处理实例清理
- **数据准确** - 确保会话数据的一致性和准确性

## 💪 TypeScript 支持

完整的 TypeScript 类型定义，智能提示和类型检查：

```typescript
import createSessionLifecycle, { 
  SessionLifecycle,
  SessionStartHandler,
  SessionEndHandler, 
  SessionLifeHandler,
  SessionLifecycleMethods 
} from '@d1-always/session-lifecycle';

// 强类型的事件处理器
const startHandler: SessionStartHandler = (data) => {
  if (data.type === 'init') {
    console.log('页面初始化会话');
  }
};

const methods: SessionLifecycleMethods = createSessionLifecycle();
methods.on_session_start(startHandler);
```

## 📋 版本更新记录

### v1.0.3 (当前版本)
- 🚀 **移动端兼容性优化** - 增加全面的移动端支持
- 📱 **自动设备检测** - 智能识别移动设备并应用优化策略
- 🎯 **移动端特殊处理** - iOS Safari、Android 浏览器专项优化
- 🔧 **触摸事件支持** - 完整的触摸手势和移动端生命周期事件
- 📋 **移动端测试页面** - 提供专门的移动端测试和调试工具
- ⚡ **性能优化** - 移动端节能模式和网络状态监听

### v1.0.2
- 🔄 **异步销毁机制** - 引入异步工厂函数，确保回调完整性
- 🛡️ **单例模式增强** - 自动管理实例，防止冲突和内存泄漏
- ⚡ **异步 API** - `createSessionLifecycle()` 现在返回 Promise
- 🔧 **向后兼容** - 保留 `createSessionLifecycleSync()` 同步版本
- 📚 **文档完善** - 增加异步使用说明和最佳实践指南
- 🎯 **实例安全性** - 确保资源清理的完整性和数据一致性

### v1.0.1
- 📝 **项目信息完善** - 添加作者信息和联系方式
- 🔗 **链接补充** - 增加 GitHub 项目主页和问题追踪链接
- 📖 **文档结构优化** - 调整 README 格式，增加目录结构说明
- 🚀 **发布流程** - 添加 npm 发布流程和使用指南

### v1.0.0 (初始版本)
- 🎉 **核心功能实现** - 会话生命周期管理的基础架构
- ⏱️ **智能监控** - 30秒心跳和2分钟不活动检测
- 👁️ **页面可见性** - 标签页切换时的会话暂停/恢复
- 🎣 **事件系统** - `on_session_start`、`on_session_end`、`on_session_life`
- 💪 **TypeScript 支持** - 完整类型定义和智能提示
- 🌐 **多格式支持** - ES模块、CommonJS、UMD格式
- 📦 **构建系统** - Rollup 构建配置和多目标输出
- 📚 **文档和示例** - 完整的使用文档和代码示例

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
npm install @d1-always/session-lifecycle

# 清理构建文件
npm run clean
```

构建将生成以下格式的文件：
- `dist/esm/` - ES 模块
- `dist/cjs/` - CommonJS 模块  
- `dist/umd/` - UMD 格式 (浏览器)
- `dist/types/` - TypeScript 类型定义
