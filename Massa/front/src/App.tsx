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
import React from 'react';
import { useEffect, useState } from 'react';

const sc_addr = "A125H3UFANWKVfKuZ5KiUwFFk9pe4HcNvBZJLbdsnp2JffvLcuBy"
const JSON_RPC_URL_PUBLIC = import.meta.env.VITE_JSON_RPC_URL_PUBLIC;
const WALLET_PRIVATE_KEY = import.meta.env.VITE_WALLET_PRIVATE_KEY;
const WALLET_PUBLIC_KEY = import.meta.env.VITE_WALLET_PUBLIC_KEY;
const WALLET_ADDRESS = import.meta.env.VITE_WALLET_ADDRESS;

function Content() {
  const [web3client, setWeb3client] = useState<Client | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  
  useEffect(() => {
    const initClient = async () => {
      const base_account = {
        publicKey: WALLET_PUBLIC_KEY,
        secretKey: WALLET_PRIVATE_KEY,
        address: WALLET_ADDRESS,
      } as IAccount;

      const client = await ClientFactory.createCustomClient(
        [
          { url: JSON_RPC_URL_PUBLIC, type: ProviderType.PUBLIC } as IProvider,
          // This IP is false but we don't need private for this script so we don't want to ask one to the user
          // but massa-web3 requires one
          { url: JSON_RPC_URL_PUBLIC, type: ProviderType.PRIVATE } as IProvider,
        ],
        true,
        base_account,
      );


      // get the balance of the wallet
      const balance: IBalance | null = await client.wallet().getAccountBalance(WALLET_ADDRESS);
      setWeb3client(client);
      setBalance(balance!.final.toValue())
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

  const [openState, setopenState] = React.useState({
    swapID: "",
    timeLock: 0,
    massaValue: 0,
    withdrawTrader: "",
    secretLock: ""
  })

  const [closeState, setcloseState] = React.useState({
    swapID: "",
    secretKey: ""
  })

  const [infoState, setinfoState] = React.useState({
    swapID: ""
  })

  function handleChangeOpen(evt: { target: { value: string | number; name: any; }; }) {
    const value = evt.target.value;
    setopenState({
      ...openState,
      [evt.target.name]: value
    });
  }

  function handleChangeClose(evt: { target: { value: string | number; name: any; }; }) {
    const value = evt.target.value;
    setcloseState({
      ...closeState,
      [evt.target.name]: value
    });
  }

  function handleChangeInfo(evt: { target: { value: string | number; name: any; }; }) {
    const value = evt.target.value;
    setinfoState({
      ...infoState,
      [evt.target.name]: value
    });
  }

  async function handleSubmitOpen() {
    funcOpen(openState.swapID, openState.timeLock, openState.massaValue, openState.withdrawTrader, openState.secretLock)
  }
  async function handleSubmitClose() {
    funcClose(closeState.swapID, closeState.secretKey)
  }
  async function handleSubmitInfo() {
    const result = await funcSwap(closeState.swapID)
    alert(result)
  }

  return (
    <>
      <div>
        <h1>BRIDGE Massa </h1>
        <div>
          <p>your balance : {balance}</p>
        </div>
        <div>
          <form  onSubmit={handleSubmitOpen}>
            <div>
              <label htmlFor="swapID">swapID : </label>
              <input type="text" name="swapID" value={openState.swapID} onChange={handleChangeOpen} />
            </div>
            <div>
              <label htmlFor="timeLock">timeLock : </label>
              <input type="number" name="timeLock" value={openState.timeLock} onChange={handleChangeOpen} />
            </div>
            <div>
              <label htmlFor="massaValue">massaValue : </label>
              <input type="number" name="massaValue" value={openState.massaValue} onChange={handleChangeOpen} />
            </div>
            <div>
              <label htmlFor="withdrawTrader">withdrawTrader : </label>
              <input type="text" name="withdrawTrader" value={openState.withdrawTrader} onChange={handleChangeOpen} />
            </div>
            <div>
              <label htmlFor="secretLock">secretLock : </label>
              <input type="text" name="secretLock" value={openState.secretLock} onChange={handleChangeOpen} />
            </div>
            <button type="submit">Create</button>
          </form>
        </div>
        <div>
          <form  onSubmit={handleSubmitClose}>
            <div>
              <label htmlFor="swapID">swapID : </label>
              <input type="text" name="swapID" value={closeState.swapID} onChange={handleChangeClose} />
            </div>
            <div>
              <label htmlFor="secretKey">secretKey : </label>
              <input type="text" name="secretKey" value={closeState.secretKey} onChange={handleChangeClose} />
            </div>
            <button type="submit">Close</button>
          </form>
        </div>
        <div>
        <form  onSubmit={handleSubmitInfo}>
            <div>
              <label htmlFor="swapID">swapID : </label>
              <input type="text" name="swapID" value={infoState.swapID} onChange={handleChangeInfo} />
            </div>
            <button type="submit">Get</button>
          </form>
        </div>
      </div>
    </>
  )
}

export default Content;