import {
  Args,
  Client,
  ClientFactory,
  EOperationStatus,
  IAccount,
  IBalance,
  ICallData,
  IDatastoreEntry,
  IProvider,
  ProviderType,
  IDatastoreEntryInput
} from '@massalabs/massa-web3';
import React from 'react';
import { useEffect, useState } from 'react';

const sc_addr = "A123DomKuDckrAtefuu7qoyjJA9DjFUxniWqdxD4JmmgGg3zjks8"
const JSON_RPC_URL_PUBLIC = import.meta.env.VITE_JSON_RPC_URL_PUBLIC;
const WALLET_PRIVATE_KEY = import.meta.env.VITE_WALLET_PRIVATE_KEY;
const WALLET_PUBLIC_KEY = import.meta.env.VITE_WALLET_PUBLIC_KEY;
const WALLET_ADDRESS = import.meta.env.VITE_WALLET_ADDRESS;

function Content() {
  const [web3client, setWeb3client] = useState<Client | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [base_account, setAccount] = useState<IAccount | null>(null);

  useEffect(() => {
    const initClient = async () => {
      const base_account = {
        publicKey: WALLET_PUBLIC_KEY,
        secretKey: WALLET_PRIVATE_KEY,
        address: WALLET_ADDRESS,
      } as IAccount;
      setAccount(base_account)

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

  async function DisplayEvent(opIds: string) {

    // Wait the end of deployment
    if (web3client) {
      await web3client.smartContracts().awaitRequiredOperationStatus(opIds, EOperationStatus.FINAL);

      const event = await web3client.smartContracts().getFilteredScOutputEvents({
        emitter_address: null,
        start: null,
        end: null,
        original_caller_address: null,
        original_operation_id: opIds,
        is_final: null,
      });

      if (event.length) {
        let result
        // This prints the deployed SC address
        event.forEach((e) => {
          result = e.data
          console.log(e.data);
        });
        return result
      }
      else {
        console.log('Call done. No events has been generated');
        return ('Call done. No events has been generated')
      }
    }
  }

  async function funcOpen(swapID: string, timeLock: number, massaValue: number, withdrawTrader: string, secretLock: string) {
    let args = new Args();
    args.addString(swapID);
    args.addU64(BigInt(timeLock));
    args.addU64(BigInt(massaValue))
    args.addString(withdrawTrader);
    args.addString(secretLock);
    if (web3client && base_account) {
      const tx = await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000000,
        coins: 0.1,
        targetAddress: sc_addr,
        functionName: "open",
        parameter: args.serialize()
      } as ICallData,
        base_account
      );
      return (tx.toString())
    }
    return ('nothing')
  }

  async function funcClose(swapID: string, secretKey: string) {
    let args = new Args();
    args.addString(swapID);
    args.addString(secretKey);
    if (web3client && base_account) {
      const tx = await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000000,
        coins: 0.1,
        targetAddress: sc_addr,
        functionName: "close",
        parameter: args.serialize()
      } as ICallData,
        base_account
      );
      return (tx.toString())
    }
    return ('nothing')
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
    if (web3client && base_account) {
      const result = await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000,
        coins: 0.1,
        targetAddress: sc_addr,
        functionName: "swap",
        parameter: args.serialize()
      } as ICallData,
        base_account
      );
      return (result.toString())
    }
    return ('nothing')
  }

  async function funcGetSwapinfo(swapID: string) {
    let args = new Args();
    args.addString(swapID);
    if (web3client && base_account) {
      const datastoreEntries: Array<IDatastoreEntry> = await web3client
        .publicApi()
        .getDatastoreEntries([
          {
            address: sc_addr,
            key: [0],
            //key: "swap1"
          } as IDatastoreEntryInput,
        ]);
      console.log(datastoreEntries[0])
      return(datastoreEntries)
    }
    return ('nothing')
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

  const [swapID, setswapID] = useState('');
  const [swapIDInfo, setswapIDInfo] = useState('');
  const [openInfo, setopenInfo] = useState('');
  const [closeInfo, setcloseInfo] = useState('');

  const handleChangeOpen = (event: { target: { value: string | number; name: any; }; }) => {
    setopenState({
      ...openState,
      [event.target.name]: event.target.value
    });
  }
  const handleChangeClose = (event: { target: { value: string | number; name: any; }; }) => {
    setcloseState({
      ...closeState,
      [event.target.name]: event.target.value
    });
  }
  const handleChangeSwap = (event: { target: { value: React.SetStateAction<string>; }; }) => {
    setswapID(event.target.value)
  }

  async function handleSubmitOpen() {
    const result = await funcOpen(openState.swapID, openState.timeLock, openState.massaValue, openState.withdrawTrader, openState.secretLock)
    const display = await DisplayEvent(result)
    setopenInfo(display)
    console.log(display)
  }
  async function handleSubmitClose() {
    const result = await funcClose(closeState.swapID, closeState.secretKey)
    const display = await DisplayEvent(result)
    setcloseInfo(display)
    console.log(display)
  }
  async function handleSubmitSwap() {
    const result = await funcSwap(swapID)
    const display = await DisplayEvent(result)
    setswapIDInfo(display)
    console.log(display)
  }
  async function handleSubmitSwap2() {
    const result = await funcGetSwapinfo(swapID)
    console.log(result)
  }

  return (
    <>
      <div>
        <h1>BRIDGE Massa </h1>
        <div>
          <p>your balance : {balance}</p>
        </div>
        <h2>Open Swap : </h2>
        <div>
          <label htmlFor="swapID">swapID : </label>
          <input type="text" name="swapID" value={openState.swapID} onChange={handleChangeOpen} />
          <label htmlFor="timeLock">timeLock : </label>
          <input type="number" name="timeLock" value={openState.timeLock} onChange={handleChangeOpen} />
          <label htmlFor="massaValue">massaValue : </label>
          <input type="number" name="massaValue" value={openState.massaValue} onChange={handleChangeOpen} />
          <label htmlFor="withdrawTrader">withdrawTrader : </label>
          <input type="text" name="withdrawTrader" value={openState.withdrawTrader} onChange={handleChangeOpen} />
          <label htmlFor="secretLock">secretLock : </label>
          <input type="text" name="secretLock" value={openState.secretLock} onChange={handleChangeOpen} />
          <button onClick={handleSubmitOpen}>create</button>
          <p>Result : {openInfo}</p>
        </div>
        <h2>Close Swap : </h2>
        <div>
          <label htmlFor="swapID">swapID : </label>
          <input type="text" name="swapID" value={closeState.swapID} onChange={handleChangeClose} />
          <label htmlFor="secretKey">secretKey : </label>
          <input type="text" name="secretKey" value={closeState.secretKey} onChange={handleChangeClose} />
          <button onClick={handleSubmitClose}>create</button>
          <p>Result : {closeInfo}</p>
        </div>
        <h2>Get Swap : </h2>
        <div>
          <label htmlFor="swapID">swapID : </label>
          <input type="text" id="swap" name="swap" onChange={handleChangeSwap} value={swapID} />
          <button onClick={handleSubmitSwap}>click</button>
          <p>Result : {swapIDInfo}</p>
        </div>
        <h2>Get Swap 2: </h2>
        <div>
          <label htmlFor="swapID">swapID : </label>
          <input type="text" id="swap" name="swap" onChange={handleChangeSwap} value={swapID} />
          <button onClick={handleSubmitSwap2}>click</button>
          <p>Result : {swapIDInfo}</p>
        </div>
      </div>
    </>
  )
}

export default Content;