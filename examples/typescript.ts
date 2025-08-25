// TypeScript 示例
import createSessionLifecycle, { 
  SessionLifecycle, 
  SessionStartHandler,
  SessionEndHandler,
  SessionLifeHandler,
  SessionLifecycleConfig,
  SessionLifecycleMethods 
} from '../src/index';

// 配置选项
const config: SessionLifecycleConfig = {
  heartbeatInterval: 30000,  // 30秒心跳间隔
  inactivityTimeout: 120000, // 2分钟不活动超时
  debug: true                // 启用调试模式
};

// 方式1: 使用工厂函数 (推荐)
const sessionMethods = createSessionLifecycle(config);
const { on_session_start, on_session_end, on_session_life, destroy } = sessionMethods;

// 定义强类型的事件处理器
const startHandler: SessionStartHandler = (data) => {
  console.log('🚀 会话开始了！');
  console.log(`类型: ${data.type}`);
  console.log(`时间戳: ${new Date(data.timestamp).toISOString()}`);
  
  if (data.type === 'init') {
    console.log('📱 这是页面初始化时的会话开始');
  } else if (data.type === 'active') {
    console.log('📱 这是用户重新激活后的会话开始');
  }
};

const endHandler: SessionEndHandler = (data) => {
  console.log('🔴 会话结束了！');
  console.log(`会话时长: ${Math.round(data.duration / 1000)}秒`);
  console.log(`总时长: ${Math.round(data.total_duration / 1000)}秒`);
  console.log(`时间戳: ${new Date(data.timestamp).toISOString()}`);
};

const lifeHandler: SessionLifeHandler = (data) => {
  console.log('💓 会话心跳');
  console.log(`心跳间隔: ${Math.round(data.duration / 1000)}秒`);
  console.log(`会话总时长: ${Math.round(data.total_duration / 1000)}秒`);
  console.log(`时间戳: ${new Date(data.timestamp).toISOString()}`);
};

// 注册事件处理器
on_session_start(startHandler);
on_session_end(endHandler);
on_session_life(lifeHandler);

// 添加额外的监听器
on_session_start((data) => {
  console.log('📊 统计：会话开始事件被触发');
});

on_session_end((data) => {
  console.log('📊 统计：会话结束，会话时长' + Math.round(data.duration / 1000) + '秒，总时长' + Math.round(data.total_duration / 1000) + '秒');
});

// 方式2: 使用类实例（高级用法）
const lifecycle = new SessionLifecycle({
  debug: true,
  heartbeatInterval: 15000 // 15秒心跳（更频繁）
});

const methods = lifecycle.getMethods();

methods.on_session_start((data) => {
  console.log('📱 [实例2] 会话开始:', data.type);
});

methods.on_session_end((data) => {
  console.log('📱 [实例2] 会话结束，会话时长:', Math.round(data.duration / 1000) + '秒，总时长:', Math.round(data.total_duration / 1000) + '秒');
});

// 演示错误处理
try {
  on_session_start('not a function' as any);
} catch (error) {
  console.error('捕获到预期的错误:', (error as Error).message);
}

// 在某个时候清理资源（可选）
setTimeout(() => {
  console.log('清理 session lifecycle 资源');
  destroy(); // 清理第一个实例
  lifecycle.destroy(); // 清理第二个实例
}, 300000); // 5分钟后

console.log('TypeScript Session lifecycle 监听器已注册');
console.log('会话管理已启动，现在会监听页面活动和可见性变化');
