// The entry file of your WebAssembly module.
import { Storage, currentThread, generateEvent, Address, transferCoins } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, stringToBytes } from '@massalabs/as-types';
import { transactionCreator, transferedCoins } from '@massalabs/massa-as-sdk/assembly/std/context';

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
    public swapID: string = '',
    public timeLock: u64 = 0,
    public massaValue: u64 = 0,
    public withdrawTrader: string = '',
    public secretLock: string = '',
  ) { }

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.swapID);
    args.add(this.timeLock);
    args.add(this.massaValue);
    args.add(this.withdrawTrader);
    args.add(this.secretLock);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.swapID = args
      .nextString()
      .expect("Can't deserialize OpenSwapRequest.swapID");
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
  constructor(public swapID: string = '', public secretKey: string = '') { }

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
      .nextString()
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

  // search for a swap with swapID
  const storedSwap = Storage.has(requestData.swapID);
  // ... if found, return (Swap already exists)
  if (storedSwap) {
    return stringToBytes('Swap already exists');
  }

  let coinCallerSend = transferedCoins()
  if (coinCallerSend != requestData.massaValue) {
    return stringToBytes('Coins send by Caller no corresponding with massaValue');
  }

  //initiating swap with data given by caller
  let swap = new SWAP(
    'OPEN',
    requestData.timeLock,
    requestData.massaValue,
    transactionCreator().toString(),
    requestData.withdrawTrader,
    requestData.secretLock,
  );

  // set the file data in the storage
  let serializedSwap = swap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedSwap);
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
    return stringToBytes('Swap not exists');
  }

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const NewSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // ... if Swap not open, return (Swap not open)
  if (NewSwap.state != 'OPEN') {
    return stringToBytes('Swap not open');
  }
  // ... if caller give wrong secretKey, return (Wrong secretkey for this swap)
  if (NewSwap.secretLock != requestData.secretKey) {
    return stringToBytes('Wrong secretkey for this swap');
  }

  const target = new Address();
  target._value = NewSwap.withdrawTrader;
  transferCoins(target, NewSwap.massaValue);

  // changing Swap states
  NewSwap.state = 'CLOSE';
  NewSwap.secretKey = requestData.secretKey;

  // set the file data in the storage
  const serializedNewSwap = NewSwap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedNewSwap);
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
  if (swapExists == null) {
    return stringToBytes('Swap not exists');
  }

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const NewSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // ... if Swap not open, return (Swap not open)
  if (NewSwap.state != 'OPEN') {
    return stringToBytes('Swap not open');
  }
  // ... if timeLock are  not expired, return (Wrong timeLock for this swap)
  if (NewSwap.timeLock < currentThread()) {
    return stringToBytes('Wrong timeLock for this swap');
  }

  const target = new Address();
  target._value = NewSwap.trader;
  transferCoins(target, NewSwap.massaValue);

  // changing Swap states
  NewSwap.state = 'EXPIRED';

  // set the file data in the storage
  const serializedNewSwap = NewSwap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedNewSwap);
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
    return stringToBytes('Swap not exists');
  }

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const CurrentSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // return all infoirmations about Swap
  return stringToBytes(`${CurrentSwap.state.toString()}, ${CurrentSwap.timeLock.toString()}, ${CurrentSwap.secretLock.toString()}, ${CurrentSwap.secretKey.toString()}`);
}