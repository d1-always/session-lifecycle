# 发布到 npm

本文档说明如何发布 `@d1-always/session-lifecycle` 包到 npm。

## 发布前准备

### 1. 安装依赖

```bash
npm install
```

### 2. 构建项目

```bash
npm run build
```

这个命令会：
- 清理之前的构建文件
- 生成 TypeScript 类型定义文件 (`dist/types/`)
- 构建 CommonJS 模块 (`dist/cjs/`)
- 构建 ES 模块 (`dist/esm/`)
- 构建 UMD 格式 (`dist/umd/`)

### 3. 检查构建结果

确认 `dist/` 目录包含以下文件：
```
dist/
├── types/
│   ├── index.d.ts
│   └── index.d.ts.map
├── cjs/
│   ├── index.js
│   └── index.js.map
├── esm/
│   ├── index.js
│   └── index.js.map
└── umd/
    ├── session-lifecycle.js
    └── session-lifecycle.min.js
```

## 发布步骤

### 1. 登录 npm

```bash
npm login
```

### 2. 检查包内容

预览将要发布的文件：
```bash
npm pack --dry-run
```

### 3. 发布

由于这是一个 scoped package（@d1-always/session-lifecycle），需要指定访问权限：

```bash
# 发布到公共仓库
npm publish --access public
```

如果已经发布过，后续更新版本可以直接使用：
```bash
npm publish
```

## 版本管理

### 更新版本号

- 补丁版本 (1.0.0 → 1.0.1): `npm version patch`
- 次要版本 (1.0.0 → 1.1.0): `npm version minor`  
- 主要版本 (1.0.0 → 2.0.0): `npm version major`

### 发布预发布版本

```bash
# 发布 beta 版本
npm version prerelease --preid=beta
npm publish --tag beta

# 发布 alpha 版本  
npm version prerelease --preid=alpha
npm publish --tag alpha
```

## 自动化脚本

`package.json` 中已配置 `prepublishOnly` 脚本，会在发布前自动运行构建：

```json
{
  "scripts": {
    "prepublishOnly": "npm run build"
  }
}
```

这确保每次发布都使用最新的构建文件。

## 发布检查清单

- [ ] 更新版本号
- [ ] 更新 CHANGELOG (如果有)
- [ ] 确保所有测试通过
- [ ] 运行 `npm run build` 成功
- [ ] 检查 `dist/` 目录内容
- [ ] 运行 `npm pack --dry-run` 检查文件列表
- [ ] 执行 `npm publish`
- [ ] 验证包在 npmjs.com 上可访问
- [ ] 测试从 npm 安装和使用

## 注意事项

1. 确保 `.npmignore` 文件正确配置，避免发布不需要的文件
2. `package.json` 中的 `files` 字段限制了发布的目录
3. 发布前会自动运行构建，无需手动构建
4. 建议在发布前本地测试构建的包
