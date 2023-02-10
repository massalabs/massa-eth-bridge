// The entry file of your WebAssembly module.
import { Address, collections, currentPeriod, generateEvent, Storage } from '@massalabs/massa-as-sdk';
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
  secretKey!: string;

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
// uploaded SWAP
export const OPEN_SWAP_KEY = 'open_swap_key';
export const openSwapMap = new collections.PersistentMap<string, Uint8Array>(
  OPEN_SWAP_KEY,
);

export function open(args: StaticArray<u8>): StaticArray<u8> {
  // parse request data
  const requestData = OpenSwapRequest.fromArgs(args);

  // safely unwrap the request data
  const requestRawData = requestData.unwrap();

  // search for a swap with title in the swapID
  const storedSwapFile: Uint8Array | null = openSwapMap.get(requestRawData.swapID);
  const lastSwap = Storage.get(requestRawData.swapID)
  if (lastSwap != "") {
    return stringToBytes('Swap already exists');
  }

  const swap = {
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
  const serializedSwap = swap.toArgs().serialize();
  openSwapMap.set(requestRawData.swapID, wrapStaticArray(serializedSwap));
  return stringToBytes('Swap open');
}

export function close(args: StaticArray<u8>): StaticArray<u8> {
  let args_deserialized = new Args(args);

  let _swapID = args_deserialized.nextBytes().unwrap()
  let _secretKey = args_deserialized.nextString().unwrap()

  let lastSwap = Storage.get(_swapID);
  const swap = SWAP.parseFromBytes(lastSwap);
  if (swap.state != 'OPEN') {
    return stringToBytes('Swap not open')
  }
  if (swap.secretLock != _secretKey) {
    return stringToBytes('Wrong secretkey for this swap')
  }
  swap.state = 'CLOSE'
  swap.secretKey = _secretKey


  lastSwap = swap.serializeToBytes()
  Storage.set(_swapID, lastSwap);

  return stringToBytes('Swap closed')
}

export function expire(args: StaticArray<u8>): StaticArray<u8> {
  let args_deserialized = new Args(args);

  let _swapIDResult = args_deserialized.nextBytes();
  let _swapID = _swapIDResult.unwrap();

  let lastSwap = Storage.get(_swapID);
  const swap = SWAP.parseFromBytes(lastSwap);
  if (swap.state != 'OPEN') {
    return stringToBytes('Swap not open')
  }
  if (swap.timelock < currentPeriod()) {
    return stringToBytes('Times not expired')
  }

  swap.state = 'EXPIRED'
  lastSwap = swap.serializeToBytes()
  Storage.set(_swapID, lastSwap);
  return stringToBytes('Swap expired')
}