// The entry file of your WebAssembly module.
import { Address, currentPeriod, generateEvent, Storage } from '@massalabs/massa-as-sdk';
import { Args, bytesToString, Result, stringToBytes, unwrapStaticArray } from '@massalabs/as-types';
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

  serializeToString(): string {
    return JSON.stringify<SWAP>(this);
  }
  
  serializeToBytes(): StaticArray<u8> {
    return stringToBytes(JSON.stringify<SWAP>(this));
  }

  static parseFromString(data: string): SWAP {
    return JSON.parse<SWAP>(data);
  }

  static parseFromBytes(data: StaticArray<u8>): SWAP {
    return JSON.parse<SWAP>(bytesToString(data));
  }
}

export function open(args: StaticArray<u8>): StaticArray<u8> {
  let args_deserialized = new Args(args);

  let _swapID = args_deserialized.nextString().unwrap()

  let _erc20Value = args_deserialized.nextU64().unwrap()
  let _erc20ContractAddress = args_deserialized.nextString().unwrap()
  let _withdrawTrader = args_deserialized.nextString().unwrap()
  let _secretLock = args_deserialized.nextString().unwrap()
  let _timelock = args_deserialized.nextU64().unwrap()

  const lastSwap = Storage.get(_swapID)
  if(lastSwap != ""){
    return stringToBytes('Swap already exists');
  }
  const swap = new SWAP();
  swap.state = 'OPEN'
  swap.timelock = _timelock
  swap.erc20Value = _erc20Value
  swap.erc20Trader = transactionCreator().toByteString()
  swap.erc20ContractAddress = _erc20ContractAddress
  swap.withdrawTrader = _withdrawTrader
  swap.secretLock = _secretLock
  swap.secretKey = ''
  const newSwap = swap.serializeToString()

  Storage.set(_swapID, newSwap);
  return stringToBytes('Swap open');
}

export function close(args: StaticArray<u8>): StaticArray<u8> {
  let args_deserialized = new Args(args);

  let _swapID = args_deserialized.nextBytes().unwrap()
  let _secretKey = args_deserialized.nextString().unwrap()

  let lastSwap = Storage.get(_swapID);
  const swap = SWAP.parseFromBytes(lastSwap);
  if ( swap.state != 'OPEN'){
    return stringToBytes('Swap not open')
  }
  if ( swap.secretLock != _secretKey) {
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
  if ( swap.state != 'OPEN'){
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