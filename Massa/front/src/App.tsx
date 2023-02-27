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
  IDatastoreEntryInput,
  bytesToStr,
  strToBytes,
  MassaCoin,
} from '@massalabs/massa-web3';
import React from 'react';
import { useState } from 'react';

// Importing addresses and RPC
const sc_addr = "A123DomKuDckrAtefuu7qoyjJA9DjFUxniWqdxD4JmmgGg3zjks8"
const JSON_RPC_URL_PUBLIC = import.meta.env.VITE_JSON_RPC_URL_PUBLIC;

function Content() {
  // Creating variable to store informations about massa-web3
  const [web3client, setWeb3client] = useState<Client | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [base_account, setAccount] = useState<IAccount | null>(null);
  const [wallet, setwallet] = useState({
    secret: "",
    public: "",
    address: "",
  })

  // Recovering Event of the tx
  async function DisplayEvent(opIds: string): Promise<string> {

    if (web3client) {
      // Waitting the end of deployment
      await web3client.smartContracts().awaitRequiredOperationStatus(opIds, EOperationStatus.FINAL);
      // Getting Event from opIds
      const event = await web3client.smartContracts().getFilteredScOutputEvents({
        emitter_address: null,
        start: null,
        end: null,
        original_caller_address: null,
        original_operation_id: opIds,
        is_final: null,
      });

      if (event.length) {
        let result = ""
        // This prints the deployed SC address
        event.forEach((e) => {
          result = e.data
        });
        return result
      }
      else {
        return ('Call done. No events has been generated')
      }
    }
    return ('Web3client not initialized')
  }

  // Starting to Open Swap
  async function funcOpen(swapID: string, timeLock: number, massaValue: number, withdrawTrader: string, secretLock: string) {
    let args = new Args();
    args.addString(swapID);
    args.addU64(BigInt(timeLock));
    args.addU64(BigInt(massaValue))
    args.addString(withdrawTrader);
    args.addString(secretLock);
    if (web3client && base_account) {
      // Sending tx to open function with all parameter
      const tx = await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000000,
        coins: new MassaCoin(0.1),
        targetAddress: sc_addr,
        functionName: "open",
        parameter: args.serialize()
      } as ICallData,
        base_account
      );
      return (tx.toString())
    }
    return ('Web3client not initialized')
  }

  // Starting to Close Swap
  async function funcClose(swapID: string, secretKey: string) {
    let args = new Args();
    args.addString(swapID);
    args.addString(secretKey);
    if (web3client && base_account) {
      // Sending tx to close function with all parameter
      const tx = await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000000,
        coins: new MassaCoin(0.1),
        targetAddress: sc_addr,
        functionName: "close",
        parameter: args.serialize()
      } as ICallData,
        base_account
      );
      return (tx.toString())
    }
    return ('Web3client not initialized')
  }

  // Starting to Expire Swap
  async function funcExpire(swapID: string) {
    let args = new Args();
    args.addString(swapID);
    if (web3client && base_account) {
      // Sending tx to expire function with all parameter
      const tx = await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000000,
        coins: new MassaCoin(0.1),
        targetAddress: sc_addr,
        functionName: "expire",
        parameter: args.serialize()
      } as ICallData,
        base_account
      );
      return (tx.toString())
    }
    return ('Web3client not initialized')
  }

  // Starting to get Swap's informations
  async function funcGetSwapinfo(swapID: string) {
    if (web3client && base_account) {
      // Getting data stored in specific key given by the user
      const datastoreEntries: IDatastoreEntry[] = await web3client
        .publicApi()
        .getDatastoreEntries([
          {
            address: sc_addr,
            key: strToBytes(swapID)
        } as IDatastoreEntryInput,
        ]);
      if (!datastoreEntries[0].final_value) {
        return (strToBytes('Storage contains null for that key. Something is wrong'))
      }
      return (datastoreEntries[0].final_value)
    }
    return (strToBytes('Web3client not initialized'))
  }

  // Creating variables to store the state of the button
  const [disabled, setDisabled] = useState({
    wallet: false,
    open: false,
    close: false,
    get: false,
    expire: false
  });
  // Creating variables to store user input
  const [openState, setopenState] = useState({
    swapID: "",
    timeLock: 0,
    massaValue: 0,
    withdrawTrader: "",
    secretLock: ""
  })
  const [closeState, setcloseState] = useState({
    swapID: "",
    secretKey: ""
  })
  const [expireState, setexpireState] = useState({
    swapID: ""
  })
  const [swapID, setswapID] = useState('');
  // Creating variables to store SC output
  const [swapIDInfo, setswapIDInfo] = useState('');
  const [openInfo, setopenInfo] = useState('');
  const [closeInfo, setcloseInfo] = useState('');
  const [expireInfo, setexpireInfo] = useState('');


  // Running when inputs are changed
  const handleChangeSet = (event: { target: { value: string | number; name: any; }; }) => {
    setwallet({
      ...wallet,
      [event.target.name]: event.target.value
    });
  }
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
  const handleChangeExpire = (event: { target: { value: string | number; name: any; }; }) => {
    setexpireState({
      ...expireState,
      [event.target.name]: event.target.value
    });
  }

  // Running when button are clicked
  async function handleSubmitSet() {
    setDisabled({...disabled,wallet: true});
    const base_account = {
      address: wallet.address,
      publicKey: wallet.public,
      secretKey: wallet.secret,
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

    // Getting the balance of the wallet
    const balance: IBalance | null = await client.wallet().getAccountBalance(wallet.address);
    
    // Instantiating Client, account and balance
    setWeb3client(client);
    setAccount(base_account)
    setBalance(balance!.final.rawValue().toNumber())
    setDisabled({...disabled,wallet: false});
  }
  async function handleSubmitOpen() {
    setDisabled({...disabled,open: true});
    const result = await funcOpen(openState.swapID, openState.timeLock, openState.massaValue, openState.withdrawTrader, openState.secretLock)
    setopenInfo("transaction sent and in process")
    // Getting events
    const display = await DisplayEvent(result)
    // Storing result
    setopenInfo(display)
    setDisabled({...disabled,open: false});
  }
  async function handleSubmitClose() {
    setDisabled({...disabled,close: true});
    const result = await funcClose(closeState.swapID, closeState.secretKey)
    setcloseInfo("transaction sent and in process")
    // Getting events
    const display = await DisplayEvent(result)
    // Storing result
    setcloseInfo(display)
    setDisabled({...disabled,close: false});
  }
  async function handleSubmitSwap() {
    setDisabled({...disabled,get: true});
    const result = await funcGetSwapinfo(swapID)
    // Storing result
    setswapIDInfo(bytesToStr(result))
    setDisabled({...disabled,get: false});
  }
  async function handleSubmitExpire() {
    setDisabled({...disabled,expire: true});
    const result = await funcExpire(expireState.swapID)
    setexpireInfo("transaction sent and in process")
    // Getting events
    const display = await DisplayEvent(result)
    // Storing result
    setexpireInfo(display)
    setDisabled({...disabled,expire: false});
  }

  return (
    <>
      <div>
        <h1>BRIDGE Massa </h1>
        <h2>Set your Wallet : </h2>
        <div>
          <label htmlFor="secret">private key : </label>
          <input type="text" name="secret" value={wallet.secret} onChange={handleChangeSet} />
          <label htmlFor="public">public key : </label>
          <input type="text" name="public" value={wallet.public} onChange={handleChangeSet} />
          <label htmlFor="address">address : </label>
          <input type="text" name="address" value={wallet.address} onChange={handleChangeSet} />
          <button onClick={handleSubmitSet} disabled={disabled.wallet}>connect</button>
        </div>
        <div>your balance : {balance}
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
          <button onClick={handleSubmitOpen} disabled={disabled.open}>open</button>
          <p>Result : {openInfo}</p>
        </div>
        <h2>Close Swap : </h2>
        <div>
          <label htmlFor="swapID">swapID : </label>
          <input type="text" name="swapID" value={closeState.swapID} onChange={handleChangeClose} />
          <label htmlFor="secretKey">secretKey : </label>
          <input type="text" name="secretKey" value={closeState.secretKey} onChange={handleChangeClose} />
          <button onClick={handleSubmitClose} disabled={disabled.close}>close</button>
          <p>Result : {closeInfo}</p>
        </div>
        <h2>Get Swap : </h2>
        <div>
          <label htmlFor="swapID">swapID : </label>
          <input type="text" id="swap" name="swap" onChange={handleChangeSwap} value={swapID} />
          <button onClick={handleSubmitSwap} disabled={disabled.get}>get</button>
          <p>Result : {swapIDInfo}</p>
        </div>
        <h2>Expire Swap : </h2>
        <div>
          <label htmlFor="swapID">swapID : </label>
          <input type="text" name="swapID" onChange={handleChangeExpire} value={expireState.swapID} />
          <button onClick={handleSubmitExpire} disabled={disabled.expire}>expire</button>
          <p>Result : {expireInfo}</p>
        </div>
      </div>
    </>
  )
}

export default Content;