import { Storage, generateEvent, Address, transferCoins, sha256 } from '@massalabs/massa-as-sdk';
import { Args, boolToByte, bytesToU64, stringToBytes, u64ToBytes } from '@massalabs/as-types';
import { timestamp, transactionCreator, transferedCoins } from '@massalabs/massa-as-sdk/assembly/std/context';
import { SWAP } from './types';
import { CloseSwapRequest, ExpireSwapRequest, OpenSwapRequest, SwapRequest } from './requests';

export const counterKey = stringToBytes('Counter');

export function constructor(): void {
  Storage.set(counterKey, u64ToBytes(0));
}

/**
 * @param binaryArgs - serialized OpenSwapRequest object
 * @returns serialized swap if successfull
 */
export function open(binaryArgs: StaticArray<u8>): StaticArray<u8> {
  const args = new Args(binaryArgs)

  // safely unwrap the request data
  const requestData = args
    .nextSerializable<OpenSwapRequest>()
    .expect("Can't deserialize OpenSwapRequest in open function");

  // verifying coins transfered by calller and the value given
  assert(
    transferedCoins()==requestData.massaValue, 
    `Amount sent by Caller does not match massaValue. Received ${transferedCoins()} expected ${requestData.massaValue}`
  );

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
  generateEvent('Swap successfully opened');
  return serializedSwap;
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
  assert(swapExists, 'Swap does not exist')

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const updateSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // ... if Swap not open, return (Swap not open)
  assert(updateSwap.state == 'OPEN', 'Cannot close swap because swap is not in open state')

  const secretLockSent = sha256(requestData.secretKey)
  // ... if caller give wrong secretKey, return (Wrong secretkey for this swap)
  for (let i = 0; i < secretLockSent.length; i++) {
    assert(updateSwap.secretLock[i] == secretLockSent[i], `Wrong secretkey for this swap`);
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
    .expect("Can't deserialize ExpireSwapRequest for given argument");

  // searching swap with swapID
  const swapExists = Storage.has(requestData.swapID);
  assert(swapExists, 'Unable to find swapID');

  // finding Swap with swapID
  const storedSwap = Storage.get(stringToBytes(requestData.swapID));
  // initiating swap with data find
  const updateSwap = new Args(storedSwap).nextSerializable<SWAP>().unwrap();

  // ... if Swap not open, return (Swap not open)
  assert(updateSwap.state == 'OPEN', 'Cannot expire swap because swap is not in open state')

  // ... if timeLock are  not expired, return (Wrong timeLock for this swap)
  assert(updateSwap.timeLock < timestamp(), 'Timelock not expired yet')

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
    .expect('Cannot deserialize ExpireSwapRequest for given argument');

  // searching swap with swapID
  const swapExists = Storage.has(requestData.swapID);

  assert(swapExists, 'Unable to find swap with swapID: ${requestData.swapID}')

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