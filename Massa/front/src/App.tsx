import {
  Args,
  Client,
  ClientFactory,
  DefaultProviderUrls,
  IAccount,
  IBalance,
  IProvider,
  ProviderType,
  WalletClient,
} from '@massalabs/massa-web3';
import { useEffect, useState } from 'react';

const sc_addr = "A12VVvTD8bdj1LDwc2uuFNKxT26AxQGv8aDgpWS9EVjekEwTZSab"

function Content() {
  const [web3client, setWeb3client] = useState<Client | null>(null);

  useEffect(() => {
    const initClient = async () => {
      const base_account = {
        publicKey: "P12f2K8YoeqZCzWASs2wktFYYGtaHGYaeSukFBrgEnw9d3J1WsMZ",
        secretKey: "S17Zw8KN3QSzsWGof7PTgkTvyGYbZLNMZmjC4urr6ZziLonThqk",
        address: "A1qZL4iJYRDRo9EtDauJuWNj56FNXWhtKinv15GEakraBa91dEA",
      } as IAccount;

      const addr_sc = "A1jZhMhu7eCk31QNWZwv2wC8Mur2jsSyFJxfyZkkHmS3vGn33M9";

      const client = await ClientFactory.createCustomClient(
        [
          { url: "https://test.massa.net/api/v2:33035", type: ProviderType.PUBLIC } as IProvider,
          // This IP is false but we don't need private for this script so we don't want to ask one to the user
          // but massa-web3 requires one
          { url: "https://test.massa.net/api/v2:33035", type: ProviderType.PRIVATE } as IProvider,
        ],
        true,
        base_account,
      );


      // get the balance of the wallet
      const balance: IBalance | null = await client.wallet().getAccountBalance("A12mDFKzB4s8v1oYx72redn5Bp7CubgrGx6aD2EaEERGDrwU4SXL");
      console.log("Wallet_Balance : " + balance?.final.toValue());
      setWeb3client(client);
    }

    initClient().catch(console.error);
  }, []);

  async function funcOpen(swapID: string, timeLock: number, massaValue: number, withdrawTrader: string, secretLock: string) {
    let args = new Args();
    args.addString(swapID);
    args.addU64(BigInt(timeLock));
    args.addU64(BigInt(massaValue))
    args.addString(withdrawTrader);
    args.addString(secretLock);
    if (web3client) {
      await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000,
        coins: 0.1,
        targetAddress: sc_addr,
        functionName: "open",
        parameter: args.serialize()
      });
    }
  }

  async function funcClose(swapID: string, secretKey: string) {
    let args = new Args();
    args.addString(swapID);
    args.addString(secretKey);
    if (web3client) {
      await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000,
        coins: 0.1,
        targetAddress: sc_addr,
        functionName: "close",
        parameter: args.serialize()
      });
    }
  }

  async function funcExpire(swapID: string) {
    let args = new Args();
    args.addString(swapID);
    if (web3client) {
      await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000,
        coins: 0.1,
        targetAddress: sc_addr,
        functionName: "expire",
        parameter: args.serialize()
      });
    }
  }

  async function funcSwap(swapID: string) {
    let args = new Args();
    args.addString(swapID);
    if (web3client) {
      await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000,
        coins: 0.1,
        targetAddress: sc_addr,
        functionName: "swap",
        parameter: args.serialize()
      });
    }
  }

  return (
    <div>
      <h1>BRIDGE Massa </h1>
    </div>
  )
}

export default Content;