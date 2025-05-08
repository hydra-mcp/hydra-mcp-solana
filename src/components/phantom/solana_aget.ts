import React, { useEffect, useState, useRef, useMemo } from "react";
import { SolanaAgentKit, createVercelAITools } from "solana-agent-kit";
import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  sendAndConfirmRawTransaction,
  SendOptions,
  Transaction,
  TransactionSignature,
  VersionedTransaction,
} from "@solana/web3.js";
import TokenPlugin from "@solana-agent-kit/plugin-token";
import { usePhantomWallet } from "./PhantomWallet";


export const SolanaAgent = () => {
  const { phantom, connected, publicKey } = usePhantomWallet();
  console.log("publicKey", publicKey);

  const solanaTools = useMemo(() => {
    if (phantom) {
      const wallet = publicKey;
      const agent = new SolanaAgentKit(
        {
          publicKey: wallet!,
          signTransaction: async <T extends Transaction | VersionedTransaction>(
            tx: T
          ): Promise<T> => {
            console.log("sign transaction");
            if (!phantom) throw new Error("Phantom not initialized.");

            const signedTransaction = await phantom.solana.signTransaction(
              tx
            );
            return signedTransaction as T;
          },
          signMessage: async (msg) => {
            console.log("sign message");
            if (!phantom) throw new Error("Phantom not initialized.");

            const signedMessage = await phantom.solana.signMessage(
              msg
            );

            return signedMessage.signature;
          },
          sendTransaction: async (tx) => {
            console.log("send transaction");
            if (!phantom) throw new Error("Phantom not initialized.");
            const transactionHash = await phantom.solana.sendTransaction(tx);
            return transactionHash;

          },
          signAllTransactions: async <
            T extends Transaction | VersionedTransaction,
          >(
            txs: T[]
          ): Promise<T[]> => {
            console.log("sign all transaction");
            if (!phantom) throw new Error("Phantom not initialized.");

            const signedTransaction = await phantom.solana.signAllTransactions(
              txs
            );
            return signedTransaction as T[];
          },
          signAndSendTransaction: async <
            T extends Transaction | VersionedTransaction,
          >(
            tx: T,
            options?: SendOptions
          ): Promise<{ signature: string }> => {
            console.log("sign and send transaction");
            if (!phantom) throw new Error("Phantom not initialized.");
            const transactionHash = await phantom.solana.signAndSendTransaction(tx);
            return { signature: transactionHash };

          },
        },
        process.env.NEXT_PUBLIC_RPC_URL as string,
        {}
      ).use(TokenPlugin);
      // .use(DefiPlugin)

      const tools = createVercelAITools(agent, agent.actions);
      return tools;
    }
  }, [phantom, publicKey]);

  return solanaTools;
};
