// The entry file of your WebAssembly module.
import { generateEvent, Storage, fromBytes, toBytes } from '@massalabs/massa-as-sdk';
import { Args, stringToBytes, u8toByte } from '@massalabs/as-types';

export function event(_: StaticArray<u8>): StaticArray<u8> {
  const message = "I'm an event!";
  generateEvent(message);
  return stringToBytes(message);
}

export function open(args: StaticArray<u8>): void {
  let args_deserialized = new Args(args);

  let _swapIDResult = args_deserialized.nextBytes();
  let _swapID = _swapIDResult.unwrap()
  let _erc20ValueResult = args_deserialized.nextU64();
  let _erc20Value = _erc20ValueResult.unwrap()

  let _erc20ContractAddressResult = args_deserialized.nextU32();
  let _erc20ContractAddress = _erc20ContractAddressResult.unwrap()
  let _withdrawTraderResult = args_deserialized.nextU32();
  let _withdrawTrader = _withdrawTraderResult.unwrap()

  let _secretLockResult = args_deserialized.nextBytes();
  let _secretLock = _secretLockResult.unwrap()
  let _timelockResult = args_deserialized.nextU64();
  let _timelock = _timelockResult.unwrap()

  let states = "open"

  let value = new Args();
  value.add(states);
  value.add(_erc20Value);
  value.add(_erc20ContractAddress);
  value.add(_withdrawTrader);
  value.add(_secretLock);
  value.add(_timelock);
  Storage.set(_swapID, value.serialize());
}

export function close(args: StaticArray<u8>): void {
  let args_deserialized = new Args(args);

  let _swapIDResult = args_deserialized.nextBytes();
  let _swapID = _swapIDResult.unwrap()
  let _secretKeyResult = args_deserialized.nextBytes();
  let _secretKey = _secretKeyResult.unwrap()

  let swap = Storage.get(_swapID);
  let swap_deserialized = new Args(swap);
  
  let statesResult = swap_deserialized.nextString();
  let states = statesResult.unwrap()


  let newStates = "close"
  
}

export function expire(args: StaticArray<u8>): void {
  let args_deserialized = new Args(args);

  let _swapIDResult = args_deserialized.nextBytes();
  let _swapID = _swapIDResult.unwrap();


  let swap = Storage.get(_swapID);
  let swap_deserialized = new Args(swap);


  let newStates = "expire"
}