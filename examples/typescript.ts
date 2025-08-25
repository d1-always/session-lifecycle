// TypeScript 示例
import createSessionLifecycle, { 
  SessionLifecycle, 
  SessionEventHandler,
  SessionLifecycleMethods 
} from '../src/index';

// 方式1: 使用工厂函数 (推荐)
const { on_session_start, on_session_end }: SessionLifecycleMethods = createSessionLifecycle();

// 定义事件处理器
const startHandler: SessionEventHandler = () => {
  console.log('🚀 会话开始了！');
  console.log('时间:', new Date().toISOString());
};

const endHandler: SessionEventHandler = () => {
  console.log('🔴 会话结束了！');
  console.log('时间:', new Date().toISOString());
};

// 注册事件处理器
on_session_start(startHandler);
on_session_end(endHandler);

// 方式2: 使用类实例
const lifecycle = new SessionLifecycle({ 
  // 配置对象预留给将来使用
});

const methods = lifecycle.getMethods();

methods.on_session_start(() => {
  console.log('📱 通过类实例注册的开始监听器');
});

methods.on_session_end(() => {
  console.log('📱 通过类实例注册的结束监听器');
});

// 演示错误处理
try {
  on_session_start('not a function' as any);
} catch (error) {
  console.error('捕获到预期的错误:', error.message);
}

console.log('TypeScript Session lifecycle 监听器已注册');
console.log('注：实际的会话触发逻辑需要在库的内部实现中添加');
