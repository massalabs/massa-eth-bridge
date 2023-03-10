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
  strToBytes,
  MassaCoin,
  WalletClient
} from '@massalabs/massa-web3';
import React from 'react';
import { useState } from 'react';
import { ethers } from "ethers";
import { randomBytes } from 'crypto'
import './App.css'

// Importing addresses and RPC
const sc_addr = "AS1qUNsVzLDkcm1qL66XPrVtyki5B2omLtpajTYqPLJNA6ajNfwt"
const VITE_JSON_RPC_URL_PUBLIC_test = import.meta.env.VITE_JSON_RPC_URL_PUBLIC_test;
const VITE_JSON_RPC_URL_PUBLIC_inno = import.meta.env.VITE_JSON_RPC_URL_PUBLIC_inno;

const options = [
  {
    label: "testnet",
    value: VITE_JSON_RPC_URL_PUBLIC_test,
  },
  {
    label: "innonet",
    value: VITE_JSON_RPC_URL_PUBLIC_inno,
  }
]

function Content() {
  // Creating variable to store informations about massa-web3
  const [web3client, setWeb3client] = useState<Client | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [base_account, setAccount] = useState<IAccount | null>(null);
  const [wallet, setwallet] = useState({
    secret: "",
    RPC: VITE_JSON_RPC_URL_PUBLIC_test,
  })
  const [swaps, setSwaps] = useState<string[][]>([]);

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

  function hexToBytes(hex: string) {
    let bytes = [];
    for (let c = 0; c < hex.length; c += 2)
      bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
  }

  function toHexString(byteArray: Iterable<unknown> | ArrayLike<unknown>) {
    return Array.from(byteArray, function (byte) {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
  }

  // Starting to Open Swap
  async function funcOpen(timeLock: number, massaValue: number, withdrawTrader: string, secretLock: Uint8Array) {
    let args = new Args();
    args.addU64(BigInt(timeLock));
    args.addU64(BigInt(massaValue * 1e9))
    args.addString(withdrawTrader);
    args.addUint8Array(secretLock);
    if (web3client && base_account) {
      // Sending tx to open function with all parameter
      const tx = await web3client.smartContracts().callSmartContract({
        fee: 0,
        maxGas: 1000000000,
        coins: new MassaCoin(massaValue),
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
  async function funcClose(swapID: string, secretKey: Uint8Array) {
    let args = new Args();
    args.addString(swapID);
    args.addUint8Array(secretKey);
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

  // Starting to get current swap
  async function listSwaps() {
    if (web3client && base_account) {
      // Getting data stored in specific key given by the user
      const datastoreEntries: IDatastoreEntry[] = await web3client
        .publicApi()
        .getDatastoreEntries([
          {
            address: sc_addr,
            key: strToBytes('Counter')
          } as IDatastoreEntryInput,
        ]);
      if (!datastoreEntries[0].final_value![0]) {
        return (strToBytes('Storage contains null for that key. Something is wrong'))
      }
      return (datastoreEntries[0].final_value![0])
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
    timeLock: 0,
    massaValue: 0,
    withdrawTrader: "",
    password: ""
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
    setDisabled({ ...disabled, wallet: true });

    // Initiating wallet
    const base_account = await WalletClient.getAccountFromSecretKey(wallet.secret) as IAccount
    const client = await ClientFactory.createCustomClient(
      [
        { url: wallet.RPC, type: ProviderType.PUBLIC } as IProvider,
        // This IP is false but we don't need private for this script so we don't want to ask one to the user
        // but massa-web3 requires one
        { url: wallet.RPC, type: ProviderType.PRIVATE } as IProvider,
      ],
      true,
      base_account,
    );

    // Getting the balance of the wallet
    const balance: IBalance | null = await client.wallet().getAccountBalance(base_account.address!);

    // Instantiating Client, account and balance
    await setWeb3client(client);
    setAccount(base_account)
    setBalance(balance!.final.rawValue().toNumber())
    setDisabled({ ...disabled, wallet: false });
  }

  async function handleSubmitOpen() {
    setDisabled({ ...disabled, open: true });
    // Creating random byte array and hash it
    const secret = ethers.sha256(randomBytes(32));

    //Convert hex string to unint8array and hash it
    const lockString = ethers.sha256(new Uint8Array(hexToBytes(secret)));

    //Convert hex string to unint8array and remove the 0x at the beginning
    const lock = new Uint8Array(hexToBytes(lockString)).subarray(1);
    
    //Display secret to user
    alert("This is your secret. Please note it down as it will be required to close the swap\nSecret: "+secret);

    //Open the swap
    const result = await funcOpen(openState.timeLock, openState.massaValue, openState.withdrawTrader, lock)

    setopenInfo("processing transaction...")

    // Getting events
    const display = await DisplayEvent(result)
    // Storing result
    setopenInfo(display)
    setDisabled({ ...disabled, open: false });
  }

  async function handleSubmitOpenSame() {
    setDisabled({ ...disabled, open: true });

    //Convert hex string to unint8array and remove the 0x at the beginning
    const lock = new Uint8Array(hexToBytes(openState.password)).subarray(1);
    
    //Display secret to user
    alert("This is your secretLock.\nSecretLock: "+openState.password);

    //Open the swap
    const result = await funcOpen(openState.timeLock, openState.massaValue, openState.withdrawTrader, lock)

    setopenInfo("processing transaction...")

    // Getting events
    const display = await DisplayEvent(result)
    // Storing result
    setopenInfo(display)
    setDisabled({ ...disabled, open: false });
  }

  async function handleSubmitClose() {
    setDisabled({ ...disabled, close: true });

    const secretKeyInBytes = hexToBytes(closeState.secretKey);
    const finale = new Uint8Array(secretKeyInBytes)
    const result = await funcClose(closeState.swapID, finale)
    setcloseInfo("transaction sent and in process")
    // Getting events
    const display = await DisplayEvent(result)
    // Storing result
    setcloseInfo(display)
    setDisabled({ ...disabled, close: false });
  }

  async function handleSubmitSwap() {
    setDisabled({ ...disabled, get: true });
    const infosSwap = await funcGetSwapinfo(swapID)
    const age_decode = new Args(infosSwap);
    let state = age_decode.nextString();
    let timeLock = age_decode.nextU64()
    let massaValue = age_decode.nextU64()
    let trader = age_decode.nextString()
    let withdrawTrader = age_decode.nextString()
    let secretLock = age_decode.nextUint8Array()

    const time = Number(timeLock)
    const d = new Date(time);
    const formattedmassaValue = (Number(massaValue) / 10 ** 9).toLocaleString();

    let infos = ['']
    infos.push(state)
    infos.push(d.toString())
    infos.push(formattedmassaValue)
    infos.push(trader)
    infos.push(withdrawTrader)
    infos.push("0x" + toHexString(secretLock))
    if (state == 'CLOSE') {
      let secretKey = age_decode.nextUint8Array()
      infos.push("0x" + toHexString(secretKey).substring(2))
    } else {
      infos.push("NOT PUBLIC")
    }
    
    // Storing result
    setswapIDInfo(`status : ${infos[1]} timeLock : ${infos[2]} massaValue : ${infos[3]} trader : ${infos[4]} withdrawTrader : ${infos[5]} secretLock : ${infos[6]} secretKey : ${infos[7]}`)
    setDisabled({ ...disabled, get: false });
  }

  async function handleSubmitExpire() {
    setDisabled({ ...disabled, expire: true });
    const result = await funcExpire(expireState.swapID)
    setexpireInfo("transaction sent and in process")
    // Getting events
    const display = await DisplayEvent(result)
    // Storing result
    setexpireInfo(display)
    setDisabled({ ...disabled, expire: false });
  }

  async function handleSubmitOrderBook() {
    setDisabled({ ...disabled, wallet: true });
    const result = await listSwaps()
    let temporarySwaps = []
    for (let i = 1; i <= result; i++) {
      let infosSwap = await funcGetSwapinfo(i.toString())
      const age_decode = new Args(infosSwap);
      let state = age_decode.nextString();
      let timeLock = age_decode.nextU64()
      let massaValue = age_decode.nextU64()
      let trader = age_decode.nextString()
      let withdrawTrader = age_decode.nextString()
      let secretLock = age_decode.nextUint8Array()

      const time = Number(timeLock)
      const d = new Date(time);
      const formattedmassaValue = (Number(massaValue) / 10 ** 9).toLocaleString();

      let infos = ['']
      infos.push(state)
      infos.push(d.toString())
      infos.push(formattedmassaValue)
      infos.push(trader)
      infos.push(withdrawTrader)
      infos.push("0x" + toHexString(secretLock))
      if (state == 'CLOSE') {
        let secretKey = age_decode.nextUint8Array()
        infos.push("0x" + toHexString(secretKey).substring(2))
      } else {
        infos.push("NOT PUBLIC")
      }
      temporarySwaps.push(infos)
    }
    setSwaps(temporarySwaps)
    setDisabled({ ...disabled, wallet: false });
  }

  return (
    <>
      <div>
        <h1>BRIDGE Massa </h1>
        <h2>Set your Wallet : </h2>
        <div>
          <label htmlFor="secret">private key : </label>
          <input type="text" name="secret" value={wallet.secret} onChange={handleChangeSet} />
          <span> </span>
          <select name="RPC" value={wallet.RPC} onChange={handleChangeSet}>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <p>Your current Network :</p>
          <p>{wallet.RPC}</p>
          <button onClick={handleSubmitSet} disabled={disabled.wallet}>connect</button>
        </div>
        <div>
          <div>
            Address :{base_account?.address}
          </div>
          Balance : {balance}
        </div>
        <h2>Open Swap : </h2>
        <div>
          <label htmlFor="timeLock">timeLock : </label>
          <input type="number" name="timeLock" value={openState.timeLock} onChange={handleChangeOpen} />
          <label htmlFor="massaValue">massaValue : </label>
          <input type="number" name="massaValue" value={openState.massaValue} onChange={handleChangeOpen} />
          <label htmlFor="withdrawTrader">withdrawTrader : </label>
          <input type="text" name="withdrawTrader" value={openState.withdrawTrader} onChange={handleChangeOpen} />
          <button onClick={handleSubmitOpen} disabled={disabled.open}>Create New Swap</button>
          <label htmlFor="password">password : </label>
          <input type="text" name="password" value={openState.password} onChange={handleChangeOpen} />
          <button onClick={handleSubmitOpenSame} disabled={disabled.open}>Create the same swap as in Massa</button>
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
        <h2>Order book : </h2>
        <button onClick={handleSubmitOrderBook} disabled={disabled.wallet}>display order book</button>
        <div>
          {swaps.map((item, index) => (
            <div>
              <table>
                <tbody>
                  <tr>
                    <th scope="col">swapID</th>
                    <th scope="col">status</th>
                    <th scope="col">timeLock</th>
                    <th scope="col">massaValue</th>
                    <th scope="col">trader</th>
                    <th scope="col">withdrawTrader</th>
                    <th scope="col">secretLock</th>
                    <th scope="col">secretKey</th>
                  </tr>
                  <tr>
                    <td>{index + 1}</td>
                    <td>{item[1]}</td>
                    <td>{item[2]}</td>
                    <td>{item[3]}</td>
                    <td>{item[4]}</td>
                    <td>{item[5]}</td>
                    <td>{item[6]}</td>
                    <td>{item[7]}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default Content;