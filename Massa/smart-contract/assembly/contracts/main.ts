// The entry file of your WebAssembly module.
import { Storage, currentThread, generateEvent } from '@massalabs/massa-as-sdk';
import { Args, Result, Serializable, stringToBytes } from '@massalabs/as-types';
import { transactionCreator } from '@massalabs/massa-as-sdk/assembly/std/context';

export function event(_: StaticArray<u8>): StaticArray<u8> {
  const message = "I'm an event!";
  generateEvent(message);
  return stringToBytes(message);
}

export class SWAP implements Serializable {
  constructor(
    public state: string = 'INVALID',
    public timeLock: u64 = 0,
    public erc20Value: u64 = 0,
    public erc20Trader: string = '',
    public erc20ContractAddress: string = '',
    public withdrawTrader: string = '',
    public secretLock: string = '',
    public secretKey: string = '',
  ) {}

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.state);
    args.add(this.timeLock);
    args.add(this.erc20Value);
    args.add(this.erc20Trader);
    args.add(this.erc20ContractAddress);
    args.add(this.withdrawTrader);
    args.add(this.secretLock);
    return args.serialize();
  }

  public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
    const args = new Args(data, offset);
    this.state = args.nextString().expect("Can't deserialize SWAP.state");
    this.timeLock = args.nextU64().expect("Can't deserialize SWAP.timeLock");
    this.erc20Value = args
      .nextU64()
      .expect("Can't deserialize SWAP.erc20Value");
    this.erc20Trader = args
      .nextString()
      .expect("Can't deserialize SWAP.erc20Trader");
    this.erc20ContractAddress = args
      .nextString()
      .expect("Can't deserialize SWAP.erc20ContractAddress");
    this.withdrawTrader = args
      .nextString()
      .expect("Can't deserialize SWAP.withdrawTrader");
    this.secretLock = args
      .nextString()
      .expect("Can't deserialize SWAP.secretLock");

    return new Result(args.offset);
  }
}

export class OpenSwapRequest implements Serializable {
  constructor(
    public swapID: string = '',
    public timeLock: u64 = 0,
    public erc20Value: u64 = 0,
    public erc20ContractAddress: string = '',
    public withdrawTrader: string = '',
    public secretLock: string = '',
  ) {}

  public serialize(): StaticArray<u8> {
    const args = new Args();
    args.add(this.swapID);
    args.add(this.timeLock);
    args.add(this.erc20Value);
    args.add(this.erc20ContractAddress);
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
    this.erc20Value = args
      .nextU64()
      .expect("Can't deserialize OpenSwapRequest.erc20Value");
    this.erc20ContractAddress = args
      .nextString()
      .expect("Can't deserialize OpenSwapRequest.erc20ContractAddress");
    this.withdrawTrader = args
      .nextString()
      .expect("Can't deserialize OpenSwapRequest.withdrawTrader");
    this.secretLock = args
      .nextString()
      .expect("Can't deserialize OpenSwapRequest.secretLock");

    return new Result(args.offset);
  }
}

export class CloseSwapRequest implements Serializable {
  constructor(public swapID: string = '', public secretKey: string = '') {}

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

export class ExpireSwapRequest implements Serializable {
  constructor(public swapID: string = '') {}

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

export function open(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const requestData = args
    .nextSerializable<OpenSwapRequest>()
    .expect("Can't deserialize OpenSwapRequest in function open");

  // search for a swap with swapID
  const storedSwap = Storage.has(requestData.swapID);
  // ... if found, return (Swap already exists)
  if (storedSwap) {
    return stringToBytes('Swap already exists');
  }

  let swap = new SWAP(
    'OPEN',
    requestData.timeLock,
    requestData.erc20Value,
    transactionCreator().toString(),
    requestData.erc20ContractAddress,
    requestData.withdrawTrader,
    requestData.secretLock,
  );

  // set the file data in the storage
  let serializedSwap = swap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedSwap);
  return stringToBytes('Swap was successfully opened');
}

export function close(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);
  // parse request data
  const requestData = args
    .nextSerializable<CloseSwapRequest>()
    .expect(
      "Can't deserialize requestData as CloseSwapRequest in close function",
    );

  // search for a swap with title in the swapID
  const swapExists = Storage.has(requestData.swapID);
  if (!swapExists) {
    return stringToBytes('Swap not exists');
  }

  const storedSwap = Storage.get(stringToBytes(requestData.swapID));

  const NewSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  if (NewSwap.state != 'OPEN') {
    return stringToBytes('Swap not open');
  }
  if (NewSwap.secretLock != requestData.secretKey) {
    return stringToBytes('Wrong secretkey for this swap');
  }
  NewSwap.state = 'CLOSE';
  NewSwap.secretKey = requestData.secretKey;

  // set the file data in the storage
  const serializedNewSwap = NewSwap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedNewSwap);
  return stringToBytes('Swap closed');
}

export function expire(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  // parse request data
  const requestData = new Args(binaryArgs)
    .nextSerializable<ExpireSwapRequest>()
    .expect("Can't deserialize ExpireSwapRequest from giben argument");

  // search for a swap with swapID
  const swapExists = Storage.has(requestData.swapID);
  if (swapExists == null) {
    return stringToBytes('Swap not exists');
  }

  const storedSwap = Storage.get(stringToBytes(requestData.swapID));

  const NewSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  if (NewSwap.state != 'OPEN') {
    return stringToBytes('Swap not open');
  }
  if (NewSwap.timeLock < currentThread()) {
    return stringToBytes('Wrong timeLock for this swap');
  }
  NewSwap.state = 'EXPIRED';

  // set the file data in the storage
  const serializedNewSwap = NewSwap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedNewSwap);
  return stringToBytes('Swap expired');
}
