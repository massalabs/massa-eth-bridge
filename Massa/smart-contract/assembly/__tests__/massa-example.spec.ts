import { Args, NoArg, bytesToString, stringToBytes } from '@massalabs/as-types';
import { event } from '../contracts/main';
import { SWAP, open, close, expire } from '../contracts/main';

describe('Group test', () => {
  test('Testing event', () => {
    expect(event([])).toStrictEqual(stringToBytes("I'm an event!"));
  });
});

describe('Open test', () => {
  test('Create swap', () => {
    expect(bytesToString(open(new Args().add('ID1').add(10 as u64).add('ox345266').add('ox345266').add('ox345266').add(40 as u64).serialize()))).toStrictEqual('Swap open');
  });
});