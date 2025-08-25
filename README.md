# session-lifecycle

一个现代化的 TypeScript/JavaScript 库，用于管理会话生命周期事件，提供 `on_session_start` 和 `on_session_end` 方法。

## 特性

- ✅ 支持 TypeScript 和 JavaScript
- ✅ 支持 ES 模块、CommonJS 和 UMD 格式
- ✅ 可通过 script 标签直接引入
- ✅ 完整的类型定义
- ✅ 轻量级，无外部依赖

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

## 使用方法

### ES 模块 / TypeScript

```typescript
import createSessionLifecycle, { SessionLifecycle } from 'session-lifecycle';

// 方式1: 使用工厂函数 (推荐)
const { on_session_start, on_session_end } = createSessionLifecycle();

on_session_start(() => {
  console.log('会话开始了！');
});

on_session_end(() => {
  console.log('会话结束了！');
});

// 方式2: 使用类实例
const lifecycle = new SessionLifecycle();
const methods = lifecycle.getMethods();

methods.on_session_start(() => {
  console.log('会话开始了！');
});
```

### CommonJS

```javascript
const createSessionLifecycle = require('session-lifecycle').default;
// 或
const { SessionLifecycle } = require('session-lifecycle');

const { on_session_start, on_session_end } = createSessionLifecycle();

on_session_start(() => {
  console.log('会话开始了！');
});

on_session_end(() => {
  console.log('会话结束了！');
});
```

### 浏览器 (script 标签)

```html
<script src="https://unpkg.com/session-lifecycle/dist/umd/session-lifecycle.min.js"></script>
<script>
  // 通过全局对象 SessionLifecycle 访问
  const { on_session_start, on_session_end } = SessionLifecycle.default();
  
  on_session_start(function() {
    console.log('会话开始了！');
  });
  
  on_session_end(function() {
    console.log('会话结束了！');
  });
</script>
```

## API 参考

### createSessionLifecycle(config?)

工厂函数，创建一个新的会话生命周期实例并返回其方法。

**参数:**
- `config` (可选): 配置对象，预留给将来的配置选项

**返回值:**
包含 `on_session_start` 和 `on_session_end` 方法的对象

### SessionLifecycle

会话生命周期管理类。

#### 构造函数

```typescript
new SessionLifecycle(config?: SessionLifecycleConfig)
```

#### 方法

##### getMethods(): SessionLifecycleMethods

返回包含会话生命周期方法的对象。

### SessionLifecycleMethods

#### on_session_start(callback: () => void): void

注册一个在会话开始时被调用的回调函数。

**参数:**
- `callback`: 会话开始时要执行的函数

#### on_session_end(callback: () => void): void

注册一个在会话结束时被调用的回调函数。

**参数:**
- `callback`: 会话结束时要执行的函数

## TypeScript 支持

本包包含完整的 TypeScript 类型定义。当使用 TypeScript 时，你将获得完整的类型检查和智能提示。

```typescript
import createSessionLifecycle, { 
  SessionLifecycle, 
  SessionEventHandler, 
  SessionLifecycleMethods 
} from 'session-lifecycle';

const handler: SessionEventHandler = () => {
  console.log('会话事件触发');
};

const methods: SessionLifecycleMethods = createSessionLifecycle();
methods.on_session_start(handler);
```

## 许可证

MIT

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 清理构建文件
npm run clean
```

构建将生成以下格式的文件：
- `dist/esm/` - ES 模块
- `dist/cjs/` - CommonJS 模块  
- `dist/umd/` - UMD 格式 (浏览器)
- `dist/types/` - TypeScript 类型定义
