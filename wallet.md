# Wallet Login Signature (Wallet Login Signature) Integration Documentation

## Overview

Wallet login is a decentralized identity verification method based on blockchain wallets, where users prove ownership of their wallets by signing a specific message, without traditional username and password authentication.

## Signature Process

The frontend should follow these steps to obtain the signature parameters:

1. **Get Random Message (Nonce)**
   - Call the backend API to get a random message, which usually includes a timestamp and a random string
   - Interface: `GET /api/auth/nonce?wallet_address={wallet_address}`

2. **Sign Message with Wallet**
   - Use the signature method provided by the wallet to sign the message
   - Different implementations for different wallets and chains

3. **Submit Signature for Verification**
   - Submit the wallet address and signature to the login interface
   - Interface: `POST /api/auth/wallet-login`

## Implementation Example

### 1. Ethereum Wallet (Using MetaMask or other Web3 wallets)

```javascript
// 1. Connect wallet
async function connectWallet() {
  if (window.ethereum) {
    try {
      // Request account access
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

// 2. Get server random message
async function getNonce(walletAddress) {
  const response = await fetch(`https://api.your-service.com/api/auth/nonce?wallet_address=${walletAddress}`);
  const data = await response.json();
  return data.nonce; // Assuming the return format is { nonce: "message content..." }
}

// 3. Sign message
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

// 4. Login process
async function walletLogin() {
  try {
    // Connect wallet to get address
    const walletAddress = await connectWallet();
    
    // Get random message
    const nonce = await getNonce(walletAddress);
    
    // Sign message
    const signature = await signMessage(walletAddress, nonce);
    
    // Submit login request
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
    
    // Process login response
    const loginResult = await response.json();
    if (loginResult.success) {
      // Save token
      localStorage.setItem('access_token', loginResult.access_token);
      // Login successful, redirect or update status
    } else {
      // Login failed processing
    }
  } catch (error) {
    console.error("Wallet login failed:", error);
  }
}
```

### 2. Solana Wallet Implementation

```javascript
// Use Solana wallet (e.g. Phantom)
import { Connection, PublicKey } from '@solana/web3.js';

// 1. Connect Solana wallet
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

// 2. Get server random message
async function getNonce(walletAddress) {
  const response = await fetch(`https://api.your-service.com/api/auth/nonce?wallet_address=${walletAddress}`);
  const data = await response.json();
  return data.nonce;
}

// 3. Sign message
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

// 4. Login process
async function solanaWalletLogin() {
  try {
    const walletAddress = await connectSolanaWallet();
    const nonce = await getNonce(walletAddress);
    const signature = await signMessageSolana(nonce);
    
    // Base64 encode signature
    const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    
    // Submit login request
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
    // Process login result...
  } catch (error) {
    console.error("Solana wallet login failed:", error);
  }
}
```

## Security Considerations

1. **Message Format Suggestions**
   - The message should include a timestamp to avoid replay attacks
   - The message can include specific purpose instructions, such as: "Login to HYDRA_AI at 2023-10-01T12:34:56Z"
   - It can include service names to avoid cross-site signature attacks

2. **Signature Verification**
   - The backend needs to verify the validity and expiration time of the signature
   - The same nonce can only be used once

3. **User Experience**
   - Display the specific content to be signed to the user to increase transparency
   - Provide clear error prompts for failed signature verification

## Backend API Specification

### 1. Get Nonce

**Request:**
```
GET /api/auth/nonce?wallet_address={wallet_address}
```

**Response:**
```json
{
  "success": true,
  "nonce": "Login to HYDRA_AI at 2023-10-01T12:34:56Z. Nonce: a1b2c3d4",
  "expires_in": 300
}
```

### 2. Wallet Login

**Request:**
```
POST /api/auth/wallet-login
Content-Type: application/json

{
  "wallet_address": "0x1234...5678",
  "signature": "0xabcd...ef01"
}
```

**Response:**
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

## Common Issues and Solutions

1. **Signature failed**
   - Check if the wallet is correctly connected
   - Confirm that the user did not reject the signature request
   - Verify the message format is correct

2. **Verification failed**
   - Check if the signature method matches the wallet and chain
   - Ensure the nonce is not expired and not used
   - Verify the wallet address format

3. **Cross-browser/device login**
   - Implement refresh token mechanism
   - Consider multi-device session management
