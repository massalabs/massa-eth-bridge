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
    expect(bytesToString(open(new Args().add('ID1').add(10 as u64).add(40 as u64).add('ox345266').add('ox345266').add('ox345266').serialize()))).toStrictEqual('Swap open');
  });
  test('Create same swap', () => {
    open(new Args().add('ID1').add(10 as u64).add(40 as u64).add('ox345266').add('ox345266').add('ox345266').serialize())
    expect(bytesToString(open(new Args().add('ID1').add(10 as u64).add(40 as u64).add('ox345266').add('ox345266').add('ox345266').serialize()))).toStrictEqual('Swap already exists');
  });
  test('Close Swap', () => {
    expect(bytesToString(open(new Args().add('ID1').add(10 as u64).add(40 as u64).add('ox345266').add('ox345266').add('ox345266').serialize()))).toStrictEqual('Swap open');
    expect(bytesToString(close(new Args().add('ID1').add('ox345266').serialize()))).toStrictEqual('Swap closed');
  });
  test("Can't close swap", () => {
    expect(bytesToString(close(new Args().add('ID1').add('ox345266').serialize()))).toStrictEqual('Swap not exists');
  });
});