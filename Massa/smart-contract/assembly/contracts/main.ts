import { Storage, generateEvent, Address, transferCoins, sha256 } from '@massalabs/massa-as-sdk';
import { Args, bytesToU64, stringToBytes, u64ToBytes } from '@massalabs/as-types';
import { timestamp, transactionCreator, transferedCoins } from '@massalabs/massa-as-sdk/assembly/std/context';

import { SWAP } from './types';
import { CloseSwapRequest, ExpireSwapRequest, OpenSwapRequest, SwapRequest } from './requests';

export const counterKey = stringToBytes('Counter');

export function constructor(): void {
  Storage.set(counterKey, u64ToBytes(0));
}

export function event(_: StaticArray<u8>): StaticArray<u8> {
  const message = "I'm an event!";
  generateEvent(message);
  return stringToBytes(message);
}

// opening SWAP with severale informations
export function open(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs)

  // safely unwrap the request data
  const requestData = args
    .nextSerializable<OpenSwapRequest>()
    .expect("Can't deserialize OpenSwapRequest in open function");

  // verifying coins transfered by calller and the value given
  if (transferedCoins() != requestData.massaValue) {
    generateEvent(`Coins send by Caller no corresponding with massaValue ${transferedCoins()} and ${requestData.massaValue}`);
    return stringToBytes('Coins send by Caller no corresponding with massaValue');
  }

  // initiating swap with data given by caller
  let swap = new SWAP(
    'OPEN',
    timestamp() + requestData.timeLock,
    requestData.massaValue,
    transactionCreator().toString(),
    requestData.withdrawTrader,
    requestData.secretLock,
  );

  // setting the file data in the storage
  let serializedSwap = swap.serialize();
  _increment();
  Storage.set(stringToBytes(_currentCounter().toString()), serializedSwap);
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

  // searching swap with swapID
  const swapExists = Storage.has(requestData.swapID);
  if (!swapExists) {
    generateEvent('Swap not exists');
    return stringToBytes('Swap not exists');
  }

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const updateSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // ... if Swap not open, return (Swap not open)
  if (updateSwap.state != 'OPEN') {
    generateEvent('Swap not open');
    return stringToBytes('Swap not open');
  }
  const secretLockSent = sha256(requestData.secretKey)
  // ... if caller give wrong secretKey, return (Wrong secretkey for this swap)
  for (let i = 0; i < secretLockSent.length; i++) {
    if (updateSwap.secretLock[i] != secretLockSent[i]) {
      generateEvent(`Wrong secretkey for this swap`);
      return stringToBytes('Wrong secretkey for this swap');
    }
  }

  // changing Swap states
  updateSwap.state = 'CLOSE';
  updateSwap.secretKey = requestData.secretKey;

  // setting the file data in the storage
  const serializedUpdateSwap = updateSwap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedUpdateSwap);

  // sending coin to withdrawer
  const target = new Address(updateSwap.withdrawTrader);
  if (target.toString() !== updateSwap.withdrawTrader) {
    generateEvent('Error with Address');
    return stringToBytes('Error with Address');
  }
  transferCoins(target, updateSwap.massaValue);

  generateEvent('Swap closed');
  return stringToBytes('Swap closed');
}

export function expire(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const requestData = args
    .nextSerializable<ExpireSwapRequest>()
    .expect("Can't deserialize ExpireSwapRequest from giben argument");

  // searching swap with swapID
  const swapExists = Storage.has(requestData.swapID);
  if (!swapExists) {
    generateEvent('Swap not exists');
    return stringToBytes('Swap not exists');
  }

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const updateSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // ... if Swap not open, return (Swap not open)
  if (updateSwap.state != 'OPEN') {
    generateEvent('Swap not open');
    return stringToBytes('Swap not open');
  }
  // ... if timeLock are  not expired, return (Wrong timeLock for this swap)
  if (updateSwap.timeLock > timestamp()) {
    generateEvent('Wrong timeLock for this swap');
    return stringToBytes('Wrong timeLock for this swap');
  }

  // changing Swap states
  updateSwap.state = 'EXPIRED';

  // setting the file data in the storage
  const serializedUpdateSwap = updateSwap.serialize();
  Storage.set(stringToBytes(requestData.swapID), serializedUpdateSwap);

  // sending coin to initialiser
  const target = new Address(updateSwap.trader);
  transferCoins(target, updateSwap.massaValue);

  generateEvent('Swap expired');
  return stringToBytes('Swap expired');
}

export function swap(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs);

  // safely unwrap the request data
  const requestData = args
    .nextSerializable<SwapRequest>()
    .expect("Can't deserialize ExpireSwapRequest from giben argument");

  // searching swap with swapID
  const swapExists = Storage.has(requestData.swapID);
  if (!swapExists) {
    generateEvent('Swap not exists');
    return stringToBytes('Swap not exists');
  }

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const currentSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // returning all informations about Swap
  generateEvent(`${currentSwap.state.toString()}, ${currentSwap.secretLock.toString()}, ${currentSwap.secretKey.toString()}`);
  return stringToBytes(`${currentSwap.state.toString()}, ${currentSwap.secretLock.toString()}, ${currentSwap.secretKey.toString()}`);
}

export function currentSwap(): u64 {
  generateEvent(Storage.get(counterKey)[0].toString());
  return bytesToU64(Storage.get(counterKey))
}

function _increment(): void {
  Storage.set(counterKey, u64ToBytes(bytesToU64(Storage.get(counterKey)) + 1));
}

function _currentCounter(): u64 {
  return bytesToU64(Storage.get(counterKey));
}