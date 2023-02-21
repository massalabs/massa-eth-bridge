import { Address, call, callerHasWriteAccess } from '@massalabs/massa-as-sdk';
import { Args, NoArg } from '@massalabs/as-types';

/**
 * This function is meant to be called only one time: when the contract is deployed.
 *
 * @param _ - not used
 */
export function constructor(_: StaticArray<u8>): StaticArray<u8> {
  // This line is important. It ensures that this function can't be called in the future.
  // If you remove this check, someone could call your constructor function and reset your smart contract.
  if (!callerHasWriteAccess()) {
    return [];
  }
  main([]);
  return [];
}

/**
 * @param _ - not used
 * @returns empty array
 */
export function main(_: StaticArray<u8>): StaticArray<u8> {
  const address = new Address(
    'A123DomKuDckrAtefuu7qoyjJA9DjFUxniWqdxD4JmmgGg3zjks8',
  );
  call(address, 'event', NoArg, 0);
  call(address, 'open', new Args().add('swap1').add(1 as u64).add(3 as u64).add('withdraw').add('secret'), 100000000)
  call(address, 'swap', new Args().add('swap1'), 0)
  return [];
}
