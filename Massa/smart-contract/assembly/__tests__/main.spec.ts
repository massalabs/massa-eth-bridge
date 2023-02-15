import { Args, bytesToString, stringToBytes } from '@massalabs/as-types';
import { event, expire, SWAP, swap } from '../contracts/main';
import { open, close } from '../contracts/main';
import { Storage } from '@massalabs/massa-as-sdk';

describe('Group test', () => {
  test('Testing event', () => {
    expect(event([])).toStrictEqual(stringToBytes("I'm an event!"));
  });
});

describe('Open swap test', () => {
  test('Create swap', () => {
    expect(
      bytesToString(
        open(
          new Args()
            .add('ID1')
            .add(10 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('ox345266')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(Storage.get(stringToBytes('ID1'))).not.toBeNull();
  });
  test('Create same swap', () => {
    open(
      new Args()
        .add('ID2')
        .add(10 as u64)
        .add(40 as u64)
        .add('ox345266')
        .add('ox345266')
        .serialize(),
    );
    expect(
      bytesToString(
        open(
          new Args()
            .add('ID2')
            .add(10 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('ox345266')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap already exists');
  });
});

describe('Close swap test', () => {
  test('Close Swap', () => {
    expect(
      bytesToString(
        open(
          new Args()
            .add('ID3')
            .add(10 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('secretKey')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(
      bytesToString(close(new Args().add('ID3').add('secretKey').serialize())),
    ).toStrictEqual('Swap closed');
  });
  test("Can't close swap because not open", () => {
    expect(
      bytesToString(close(new Args().add('ID3').add('ox345266').serialize())),
    ).toStrictEqual('Swap not open');
  });
  test("Can't close swap because wrong secretkey", () => {
    expect(
      bytesToString(
        open(
          new Args()
            .add('ID4')
            .add(10 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('secretKey')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(
      bytesToString(close(new Args().add('ID4').add('différentekey').serialize())),
    ).toStrictEqual('Wrong secretkey for this swap');
  });
});

const SWAP1ID = 'ID5';
const SWAP1state = 'OPEN';
const SWAP1timeLock = 0;
const SWAP1secretLock = 'ox345266';
const SWAP1secretKey = '';

describe('Status swap test', () => {
  test('Status Swap', () => {
    expect(
      bytesToString(
        open(
          new Args()
            .add(SWAP1ID)
            .add(SWAP1timeLock as u64)
            .add(40 as u64)
            .add('ox345266')
            .add(SWAP1secretLock)
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(
      bytesToString(swap(new Args().add('ID5').serialize())),
    ).toStrictEqual(`${SWAP1state}, ${SWAP1timeLock}, ${SWAP1secretLock}, ${SWAP1secretKey}`);
  });
  test('Status Swap was not created', () => {
    expect(
      bytesToString(
        open(
          new Args()
            .add('ID6')
            .add(10 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('secretKey')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(
      bytesToString(swap(new Args().add('ID7').serialize())),
    ).toStrictEqual('Swap not exists');
  });
});
