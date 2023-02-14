// The entry file of your WebAssembly module.
import { Address, collections, currentPeriod, currentThread, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, bytesToString, Result, stringToBytes, unwrapStaticArray, wrapStaticArray } from '@massalabs/as-types';
import { JSON } from 'json-as/assembly';
import { transactionCreator } from '@massalabs/massa-as-sdk/assembly/std/context';

export function event(_: StaticArray<u8>): StaticArray<u8> {
  const message = "I'm an event!";
  generateEvent(message);
  return stringToBytes(message);
}

@JSON
export class SWAP {
  state: string = 'INVALID';
  timelock!: u64;
  erc20Value!: u64;
  erc20Trader!: string;
  erc20ContractAddress!: string;
  withdrawTrader!: string;
  secretLock!: string;
  secretKey: string = "";

  public toArgs(): Args {
    const args = new Args();
    args.add(this.state);
    args.add(this.timelock);
    args.add(this.erc20Value);
    args.add(this.erc20Trader);
    args.add(this.erc20ContractAddress);
    args.add(this.withdrawTrader);
    args.add(this.secretLock);
    return args;
  }

  public static fromArgs(data: StaticArray<u8>): Result<SWAP> {
    const args = new Args(data);
    const state = args.nextString().unwrap();
    const timelock = args.nextU64().unwrap();
    const erc20Value = args.nextU64().unwrap();
    const erc20Trader = args.nextString().unwrap();
    const erc20ContractAddress = args.nextString().unwrap();
    const withdrawTrader = args.nextString().unwrap();
    const secretLock = args.nextString().unwrap();

    return new Result(
      {
        state,
        timelock,
        erc20Value,
        erc20Trader,
        erc20ContractAddress,
        withdrawTrader,
        secretLock
      } as SWAP,
      null,
    );
  }

  public toJSONString(): string {
    return JSON.stringify<SWAP>(this);
  }

  public static fromJSONString(data: string): SWAP {
    const parsed = JSON.parse<SWAP>(data);
    return parsed;
  }
}

@JSON
export class OpenSwapRequest {
  swapID!: string;
  timelock!: u64;
  erc20Value!: u64;
  erc20ContractAddress!: string;
  withdrawTrader!: string;
  secretLock!: string;

  public toArgs(): Args {
    const args = new Args();
    args.add(this.swapID);
    args.add(this.timelock);
    args.add(this.erc20Value);
    args.add(this.erc20ContractAddress);
    args.add(this.withdrawTrader);
    args.add(this.secretLock);
    return args;
  }

  public static fromArgs(data: StaticArray<u8>): Result<OpenSwapRequest> {
    const args = new Args(data);
    const swapID = args.nextString().unwrap();
    const timelock = args.nextU64().unwrap();
    const erc20Value = args.nextU64().unwrap();
    const erc20ContractAddress = args.nextString().unwrap();
    const withdrawTrader = args.nextString().unwrap();
    const secretLock = args.nextString().unwrap();

    return new Result(
      {
        swapID,
        timelock,
        erc20Value,
        erc20ContractAddress,
        withdrawTrader,
        secretLock
      } as OpenSwapRequest,
      null,
    );
  }

  public toJSONString(): string {
    return JSON.stringify<OpenSwapRequest>(this);
  }

  public static fromJSONString(data: string): OpenSwapRequest {
    const parsed = JSON.parse<OpenSwapRequest>(data);
    return parsed;
  }
}

@JSON
export class CloseSwapRequest {
  swapID!: string;
  secretKey!: string;

  public toArgs(): Args {
    const args = new Args();
    args.add(this.swapID);
    args.add(this.secretKey);
    return args;
  }

  public static fromArgs(data: StaticArray<u8>): Result<CloseSwapRequest> {
    const args = new Args(data);
    const swapID = args.nextString().unwrap();
    const secretKey = args.nextString().unwrap();

    return new Result(
      {
        swapID,
        secretKey
      } as CloseSwapRequest,
      null,
    );
  }

  public toJSONString(): string {
    return JSON.stringify<CloseSwapRequest>(this);
  }

  public static fromJSONString(data: string): CloseSwapRequest {
    const parsed = JSON.parse<CloseSwapRequest>(data);
    return parsed;
  }
}



@JSON
export class ExpireSwapRequest {
  swapID!: string;

  public toArgs(): Args {
    const args = new Args();
    args.add(this.swapID);
    return args;
  }

  public static fromArgs(data: StaticArray<u8>): Result<ExpireSwapRequest> {
    const args = new Args(data);
    const swapID = args.nextString().unwrap();

    return new Result(
      {
        swapID
      } as ExpireSwapRequest,
      null,
    );
  }

  public toJSONString(): string {
    return JSON.stringify<ExpireSwapRequest>(this);
  }

  public static fromJSONString(data: string): ExpireSwapRequest {
    const parsed = JSON.parse<ExpireSwapRequest>(data);
    return parsed;
  }
}



// uploaded SWAP
export const OPEN_SWAP_KEY = 'open_swap_key';
export const SwapMap = new collections.PersistentMap<string, Uint8Array>(
  OPEN_SWAP_KEY,
);

export function open(args: StaticArray<u8>): StaticArray<u8> {
  // parse request data
  const requestData = OpenSwapRequest.fromArgs(args);

  // safely unwrap the request data
  const requestRawData = requestData.unwrap();

  // search for a swap with swapID
  const storedSwapFile: Uint8Array | null = SwapMap.get(requestRawData.swapID);
  // ... if found, return (Swap already exists)
  if (storedSwapFile != null) {
    return stringToBytes('Swap already exists');
  }

  let swap = {
    state: 'OPEN',
    timelock: requestRawData.timelock,
    erc20Value: requestRawData.erc20Value,
    erc20Trader: transactionCreator().toByteString(),
    erc20ContractAddress: requestRawData.erc20ContractAddress,
    withdrawTrader: requestRawData.withdrawTrader,
    secretLock: requestRawData.secretLock,
    secretKey: "",
  } as SWAP;

  // set the file data in the storage
  let serializedSwap = swap.toArgs().serialize();
  SwapMap.set(requestRawData.swapID, wrapStaticArray(serializedSwap));
  // verify set
  const NewSwap = SwapMap.get(requestRawData.swapID);
  if (NewSwap != null) {
    return stringToBytes('Swap open');
  }
  return stringToBytes('Error');
}

export function close(args: StaticArray<u8>): StaticArray<u8> {
  // parse request data
  const requestData = CloseSwapRequest.fromArgs(args);

  // safely unwrap the request data
  const requestRawData = requestData.unwrap();

  // search for a swap with title in the swapID
  const storedSwap: Uint8Array | null = SwapMap.get(requestRawData.swapID);
  if (storedSwap == null) {
    return stringToBytes('Swap not exists');
  }

  const parsedSwap = SWAP.fromArgs(unwrapStaticArray(storedSwap));


  let NewSwap = parsedSwap.unwrap()

  if (NewSwap.state != 'OPEN') {
    return stringToBytes('Swap not open')
  }
  if (NewSwap.secretLock != requestRawData.secretKey) {
    return stringToBytes('Wrong secretkey for this swap')
  }
  NewSwap.state = 'CLOSE'
  NewSwap.secretKey = requestRawData.secretKey


  // set the file data in the storage
  const serializedNewSwap = NewSwap.toArgs().serialize();
  SwapMap.set(requestRawData.swapID, wrapStaticArray(serializedNewSwap))
  return stringToBytes('Swap closed')
}

export function expire(args: StaticArray<u8>): StaticArray<u8> {
  // parse request data
  const requestData = ExpireSwapRequest.fromArgs(args);

  // safely unwrap the request data
  const requestRawData = requestData.unwrap();

  // search for a swap with title in the swapID
  const storedSwap: Uint8Array | null = SwapMap.get(requestRawData.swapID);
  if (storedSwap == null) {
    return stringToBytes('Swap not exists');
  }

  const parsedSwap = SWAP.fromArgs(unwrapStaticArray(storedSwap));


  let NewSwap = parsedSwap.unwrap()

  if (NewSwap.state != 'OPEN') {
    return stringToBytes('Swap not open')
  }
  if (NewSwap.timelock < currentThread()) {
    return stringToBytes('Wrong timelock for this swap')
  }
  NewSwap.state = 'EXPIRED'


  // set the file data in the storage
  const serializedNewSwap = NewSwap.toArgs().serialize();
  SwapMap.set(requestRawData.swapID, wrapStaticArray(serializedNewSwap))
  return stringToBytes('Swap expired')
}