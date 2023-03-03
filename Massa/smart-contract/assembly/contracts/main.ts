// The entry file of your WebAssembly module.
import { Storage, generateEvent, Address, transferCoins, sha256 } from '@massalabs/massa-as-sdk';
import { Args, bytesToString, bytesToU64, Result, Serializable, stringToBytes, toBytes, u64ToBytes } from '@massalabs/as-types';
import { timestamp, transactionCreator, transferedCoins } from '@massalabs/massa-as-sdk/assembly/std/context';

export const counterKey = stringToBytes('Counter');
export const initCounter = 0;

export function constructor(): void {
  Storage.set(counterKey, u64ToBytes(initCounter));
}

export function event(_: StaticArray<u8>): StaticArray<u8> {
  const message = "I'm an event!";
  generateEvent(message);
  return stringToBytes(message);
}

// define class SWAP
export class SWAP implements Serializable {
  constructor(
    public state: string = 'INVALID',
    public timeLock: u64 = 0,
    public massaValue: u64 = 0,
    public trader: string = '',
    public withdrawTrader: string = '',
    public secretLock: string = '',
    public secretKey: string = '',
  ) { }

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.state);
    args.add(this.timeLock);
    args.add(this.massaValue);
    args.add(this.trader);
    args.add(this.withdrawTrader);
    args.add(this.secretLock);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.state = args.nextString().expect("Can't deserialize SWAP.state");
    this.timeLock = args.nextU64().expect("Can't deserialize SWAP.timeLock");
    this.massaValue = args
      .nextU64()
      .expect("Can't deserialize SWAP.massaValue");
    this.trader = args
      .nextString()
      .expect("Can't deserialize SWAP.trader");
    this.withdrawTrader = args
      .nextString()
      .expect("Can't deserialize SWAP.withdrawTrader");
    this.secretLock = args
      .nextString()
      .expect("Can't deserialize SWAP.secretLock");

    return new Result(args.offset);
  }
}

// define class OpenSwapRequest to work with open function
export class OpenSwapRequest implements Serializable {
  constructor(
    public timeLock: u64 = 0,
    public massaValue: u64 = 0,
    public withdrawTrader: string = '',
    public secretLock: string = '',
  ) { }

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.timeLock);
    args.add(this.massaValue);
    args.add(this.withdrawTrader);
    args.add(this.secretLock);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.timeLock = args
      .nextU64()
      .expect("Can't deserialize OpenSwapRequest.timeLock");
    this.massaValue = args
      .nextU64()
      .expect("Can't deserialize OpenSwapRequest.massaValue");
    this.withdrawTrader = args
      .nextString()
      .expect("Can't deserialize OpenSwapRequest.withdrawTrader");
    this.secretLock = args
      .nextString()
      .expect("Can't deserialize OpenSwapRequest.secretLock");

    return new Result(args.offset);
  }
}

// define class CloseSwapRequest to work with close function
export class CloseSwapRequest implements Serializable {
  constructor(public swapID: string = '', public secretKey: StaticArray<u8> = []) { }

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.swapID);
    args.add(this.secretKey);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.swapID = args
      .nextString()
      .expect("Can't deserialize CloseSwapRequest.swapID");
    this.secretKey = args
      .nextBytes()
      .expect("Can't deserialize CloseSwapRequest.secretKey");

    return new Result(args.offset);
  }
}

// define class ExpireSwapRequest to work with expire function
export class ExpireSwapRequest implements Serializable {
  constructor(public swapID: string = '') { }

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.swapID);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.swapID = args
      .nextString()
      .expect("Can't deserialize ExpireSwapRequest.swapID");

    return new Result(args.offset);
  }
}

// define class SwapRequest to work with expire function
export class SwapRequest implements Serializable {
  constructor(public swapID: string = '') { }

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.swapID);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.swapID = args
      .nextString()
      .expect("Can't deserialize SwapRequest.swapID");

    return new Result(args.offset);
  }
}

// opening SWAP with severale informations
export function open(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs)

  // safely unwrap the request data
  const requestData = args
    .nextSerializable<OpenSwapRequest>()
    .expect("Can't deserialize OpenSwapRequest in open function");

  //let coinCallerSend = transferedCoins()
  //if (coinCallerSend != requestData.massaValue) {
  //  return stringToBytes('Coins send by Caller no corresponding with massaValue');
  //}

  //initiating swap with data given by caller
  let swap = new SWAP(
    'OPEN',
    timestamp() + requestData.timeLock,
    requestData.massaValue,
    transactionCreator().toString(),
    requestData.withdrawTrader,
    requestData.secretLock,
  );

  // set the file data in the storage
  let serializedSwap = swap.serialize();
  _increment();
  Storage.set(stringToBytes(_currentSupply().toString()), serializedSwap);
  generateEvent('Swap was successfully opened');
  return stringToBytes('Swap was successfully opened');
}

// closing SWAP with swapID and secretKey
export function close(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const requestData = args
    .nextSerializable<CloseSwapRequest>()
    .expect(
      "Can't deserialize CloseSwapRequest in close function",
    );

  // search for a swap with swapID
  const swapExists = Storage.has(requestData.swapID);
  if (!swapExists) {
    generateEvent('Swap not exists');
    return stringToBytes('Swap not exists');
  }

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const NewSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // ... if Swap not open, return (Swap not open)
  if (NewSwap.state != 'OPEN') {
    generateEvent('Swap not open');
    return stringToBytes('Swap not open');
  }
  const shaSecret = sha256(requestData.secretKey).toString()
  // ... if caller give wrong secretKey, return (Wrong secretkey for this swap)
  if (NewSwap.secretLock != shaSecret) {
    generateEvent('Wrong secretkey for this swap');
    return stringToBytes('Wrong secretkey for this swap');
  }

  //const target = new Address();
  //target._value = NewSwap.withdrawTrader;
  //transferCoins(target, NewSwap.massaValue);

  // changing Swap states
  NewSwap.state = 'CLOSE';
  NewSwap.secretKey = bytesToString(requestData.secretKey);

  // set the file data in the storage
  const serializedNewSwap = NewSwap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedNewSwap);
  generateEvent('Swap closed');
  return stringToBytes('Swap closed');
}

export function expire(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const requestData = args
    .nextSerializable<ExpireSwapRequest>()
    .expect("Can't deserialize ExpireSwapRequest from giben argument");

  // search for a swap with swapID
  const swapExists = Storage.has(requestData.swapID);
  if (!swapExists) {
    generateEvent('Swap not exists');
    return stringToBytes('Swap not exists');
  }

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const NewSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // ... if Swap not open, return (Swap not open)
  if (NewSwap.state != 'OPEN') {
    generateEvent('Swap not open');
    return stringToBytes('Swap not open');
  }
  // ... if timeLock are  not expired, return (Wrong timeLock for this swap)
  if (NewSwap.timeLock > timestamp()) {
    generateEvent('Wrong timeLock for this swap');
    return stringToBytes('Wrong timeLock for this swap');
  }

  //const target = new Address();
  //target._value = NewSwap.trader;
  //transferCoins(target, NewSwap.massaValue);

  // changing Swap states
  NewSwap.state = 'EXPIRED';

  // set the file data in the storage
  const serializedNewSwap = NewSwap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedNewSwap);
  generateEvent('Swap expired');
  return stringToBytes('Swap expired');
}

export function swap(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const requestData = args
    .nextSerializable<SwapRequest>()
    .expect("Can't deserialize ExpireSwapRequest from giben argument");

  // search for a swap with swapID
  const swapExists = Storage.has(requestData.swapID);
  if (!swapExists) {
    generateEvent('Swap not exists');
    return stringToBytes('Swap not exists');
  }

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const CurrentSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // return all infoirmations about Swap
  generateEvent(`${CurrentSwap.state.toString()}, ${CurrentSwap.secretLock.toString()}, ${CurrentSwap.secretKey.toString()}`);
  return stringToBytes(`${CurrentSwap.state.toString()}, ${CurrentSwap.secretLock.toString()}, ${CurrentSwap.secretKey.toString()}`);
}

export function currentSwap(): u64 {
  generateEvent(Storage.get(counterKey)[0].toString());
  return bytesToU64(Storage.get(counterKey))
}

function _increment(): void {
  const currentID = bytesToU64(Storage.get(counterKey));
  Storage.set(counterKey, u64ToBytes(currentID + 1));
}

function _currentSupply(): u64 {
  return bytesToU64(Storage.get(counterKey));
}