# 钱包登录签名（Wallet Login Signature）对接文档

## 概述

钱包登录是基于区块链钱包的去中心化身份验证方式，用户通过对特定消息进行签名来证明钱包的所有权，无需传统的用户名和密码。

## 签名流程

前端应该按照以下步骤获取签名参数：

1. **获取随机消息（Nonce）**
   - 调用后端 API 获取一个随机消息，该消息通常包含时间戳和随机字符串
   - 接口：`GET /api/auth/nonce?wallet_address={wallet_address}`

2. **使用钱包签名消息**
   - 通过钱包提供的签名方法对消息进行签名
   - 针对不同的钱包和链有不同的实现方式

3. **提交签名进行验证**
   - 将钱包地址和签名提交到登录接口
   - 接口：`POST /api/auth/wallet-login`

## 实现示例

### 1. 以太坊钱包（使用 MetaMask 或其他 Web3 钱包）

```javascript
// 1. 连接钱包
async function connectWallet() {
  if (window.ethereum) {
    try {
      // 请求账户访问
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } catch (error) {
      console.error("User denied account access");
      throw error;
    }
  } else {
    throw new Error("Please install MetaMask or other Web3 wallet");
  }
}

// 2. 获取服务器随机消息
async function getNonce(walletAddress) {
  const response = await fetch(`https://api.your-service.com/api/auth/nonce?wallet_address=${walletAddress}`);
  const data = await response.json();
  return data.nonce; // 假设返回格式为 { nonce: "消息内容..." }
}

// 3. 签名消息
async function signMessage(walletAddress, message) {
  try {
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, walletAddress]
    });
    return signature;
  } catch (error) {
    console.error("Error signing message:", error);
    throw error;
  }
}

// 4. 登录流程
async function walletLogin() {
  try {
    // 连接钱包获取地址
    const walletAddress = await connectWallet();
    
    // 获取随机消息
    const nonce = await getNonce(walletAddress);
    
    // 签名消息
    const signature = await signMessage(walletAddress, nonce);
    
    // 提交登录请求
    const response = await fetch('https://api.your-service.com/api/auth/wallet-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
        signature: signature
      })
    });
    
    // 处理登录响应
    const loginResult = await response.json();
    if (loginResult.success) {
      // 保存 token
      localStorage.setItem('access_token', loginResult.access_token);
      // 登录成功，重定向或更新状态
    } else {
      // 登录失败处理
    }
  } catch (error) {
    console.error("Wallet login failed:", error);
  }
}
```

### 2. Solana 钱包实现

```javascript
// 使用 Solana 钱包 (例如 Phantom)
import { Connection, PublicKey } from '@solana/web3.js';

// 1. 连接 Solana 钱包
async function connectSolanaWallet() {
  if (!window.solana || !window.solana.isPhantom) {
    throw new Error("Please install Phantom wallet");
  }
  
  try {
    const resp = await window.solana.connect();
    return resp.publicKey.toString();
  } catch (err) {
    console.error("User rejected connection", err);
    throw err;
  }
}

// 2. 获取服务器随机消息
async function getNonce(walletAddress) {
  const response = await fetch(`https://api.your-service.com/api/auth/nonce?wallet_address=${walletAddress}`);
  const data = await response.json();
  return data.nonce;
}

// 3. 签名消息
async function signMessageSolana(message) {
  try {
    const encodedMessage = new TextEncoder().encode(message);
    const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
    return signedMessage.signature;
  } catch (error) {
    console.error("Error signing message:", error);
    throw error;
  }
}

// 4. 登录流程
async function solanaWalletLogin() {
  try {
    const walletAddress = await connectSolanaWallet();
    const nonce = await getNonce(walletAddress);
    const signature = await signMessageSolana(nonce);
    
    // Base64 编码签名
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    // 提交登录请求
    const response = await fetch('https://api.your-service.com/api/auth/wallet-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet_address: walletAddress,
        signature: base64Signature
      })
    });
    
    const loginResult = await response.json();
    // 处理登录结果...
  } catch (error) {
    console.error("Solana wallet login failed:", error);
  }
}
```

## 安全注意事项

1. **消息格式建议**
   - 消息中应包含时间戳，避免重放攻击
   - 消息可以包含特定用途说明，例如："Login to HYDRA_AI at 2023-10-01T12:34:56Z"
   - 可以包含服务名称，避免跨站签名攻击

2. **签名验证**
   - 后端需要验证签名的有效性和时效性
   - 同一个 nonce 只能使用一次

3. **用户体验**
   - 为用户显示待签名的具体内容，增加透明度
   - 提供签名失败的明确错误提示

## 后端 API 规范

### 1. 获取 Nonce

**请求:**
```
GET /api/auth/nonce?wallet_address={wallet_address}
```

**响应:**
```json
{
  "success": true,
  "nonce": "Login to HYDRA_AI at 2023-10-01T12:34:56Z. Nonce: a1b2c3d4",
  "expires_in": 300
}
```

### 2. 钱包登录

**请求:**
```
POST /api/auth/wallet-login
Content-Type: application/json

{
  "wallet_address": "0x1234...5678",
  "signature": "0xabcd...ef01"
}
```

**响应:**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user_info": {
    "id": 123,
    "username": "user_0x1234",
    "wallet_address": "0x1234...5678",
    "is_admin": false
  }
}
```

## 常见问题与解决方案

1. **签名失败**
   - 检查钱包是否正确连接
   - 确认用户未拒绝签名请求
   - 验证消息格式是否正确

2. **验证失败**
   - 检查签名方法是否与钱包和链匹配
   - 确保 nonce 未过期且未被使用过
   - 验证钱包地址格式

3. **跨浏览器/设备登录**
   - 实现刷新令牌机制
   - 考虑多设备会话管理
