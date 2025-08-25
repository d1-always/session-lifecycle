// Node.js 示例 - 使用 CommonJS
const createSessionLifecycle = require('../dist/cjs/index.js').default;

// 创建会话生命周期实例
const { on_session_start, on_session_end } = createSessionLifecycle();

// 注册会话开始事件
on_session_start(() => {
  console.log('🚀 会话开始了！');
  console.log('时间:', new Date().toISOString());
});

// 注册会话结束事件
on_session_end(() => {
  console.log('🔴 会话结束了！');
  console.log('时间:', new Date().toISOString());
});

// 可以注册多个监听器
on_session_start(() => {
  console.log('📱 另一个开始监听器被触发');
});

on_session_end(() => {
  console.log('📱 另一个结束监听器被触发');
});

console.log('Session lifecycle 监听器已注册');
console.log('注：实际的会话触发逻辑需要在库的内部实现中添加');
