// Node.js 示例 - 使用 CommonJS
const createSessionLifecycle = require('../dist/cjs/index.js').default;

console.log('🚀 启动 Session Lifecycle Node.js 示例');
console.log('注：在Node.js环境中，页面可见性和DOM事件监听不可用');
console.log('会话生命周期主要适用于浏览器环境，但API可以在Node.js中正常工作\n');

// 异步初始化函数
async function initializeSession() {
  // 创建会话生命周期实例
  const sessionMethods = await createSessionLifecycle({
    debug: true,               // 启用调试模式
    heartbeatInterval: 10000,  // 10秒心跳（更快演示）
    inactivityTimeout: 60000   // 1分钟不活动超时
  });

  const { on_session_start, on_session_end, on_session_life, destroy } = sessionMethods;

  // 注册会话开始事件
  on_session_start((data) => {
    console.log('🚀 会话开始了！');
    console.log(`  类型: ${data.type}`);
    console.log(`  时间戳: ${new Date(data.timestamp).toISOString()}`);
    
    if (data.type === 'init') {
      console.log('  📱 这是初始化会话');
    } else if (data.type === 'active') {
      console.log('  📱 这是重新激活会话');
    }
    console.log('');
  });

  // 注册会话结束事件
  on_session_end((data) => {
    console.log('🔴 会话结束了！');
    console.log(`  会话时长: ${Math.round(data.duration / 1000)}秒`);
    console.log(`  总时长: ${Math.round(data.total_duration / 1000)}秒`);
    console.log(`  时间戳: ${new Date(data.timestamp).toISOString()}`);
    console.log('');
  });

  // 注册会话生命周期事件（心跳）
  on_session_life((data) => {
    console.log('💓 会话心跳');
    console.log(`  心跳间隔: ${Math.round(data.duration / 1000)}秒`);
    console.log(`  会话总时长: ${Math.round(data.total_duration / 1000)}秒`);
    console.log(`  时间戳: ${new Date(data.timestamp).toISOString()}`);
    console.log('');
  });

  // 可以注册多个监听器
  on_session_start((data) => {
    console.log('📊 [统计] 会话开始事件被触发');
  });

  on_session_end((data) => {
    console.log('📊 [统计] 会话结束，会话时长：' + Math.round(data.duration / 1000) + '秒，总时长：' + Math.round(data.total_duration / 1000) + '秒');
  });

  // 演示错误处理
  try {
    on_session_start('not a function');
  } catch (error) {
    console.log('✅ 错误处理测试通过:', error.message);
  }

  console.log('Session lifecycle 监听器已注册');
  console.log('在Node.js环境中会话会立即开始，因为没有页面可见性限制');

  // 30秒后清理资源
  setTimeout(async () => {
    console.log('\n🧹 清理会话生命周期资源...');
    await destroy();
    console.log('✅ 资源已清理，程序即将退出');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }, 30000);
}

// 启动初始化
initializeSession().catch(error => {
  console.error('❌ 初始化失败:', error);
  process.exit(1);
});
