import { Args, bytesToString, stringToBytes } from '@massalabs/as-types';
import { currentSwap, event, expire, SWAP, swap } from '../contracts/main';
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
            .add(10 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('secretKey')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
  });
});

describe('Close swap test', () => {
  test('Close Swap', () => {
    expect(
      bytesToString(
        open(
          new Args()
            .add(10 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('secretKey')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(
      bytesToString(close(new Args().add("2").add('secretKey').serialize())),
    ).toStrictEqual('Swap closed');
  });
  test("Can't close swap because not open", () => {
    expect(
      bytesToString(close(new Args().add('2').add('secretKey').serialize())),
    ).toStrictEqual('Swap not open');
  });
  test("Can't close swap because wrong secretkey", () => {
    expect(
      bytesToString(
        open(
          new Args()
            .add(10 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('secretKey')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(
      bytesToString(close(new Args().add('3').add('différentekey').serialize())),
    ).toStrictEqual('Wrong secretkey for this swap');
  });
});

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
            .add(SWAP1timeLock as u64)
            .add(40 as u64)
            .add('ox345266')
            .add(SWAP1secretLock)
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(
      bytesToString(swap(new Args().add('4').serialize())),
    ).toStrictEqual(`${SWAP1state}, ${SWAP1secretLock}, ${SWAP1secretKey}`);
  });
  test('Status Swap was not created', () => {
    expect(
      bytesToString(
        open(
          new Args()
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

describe('Expire swap test', () => {
  test('Swap not exist', () => {
    expect(
      bytesToString(expire(new Args().add('ID7').serialize())),
    ).toStrictEqual(`Swap not exists`);
  });
  test('Swap not open', () => {
    expect(
      bytesToString(expire(new Args().add('2').serialize())),
    ).toStrictEqual(`Swap not open`);
  });
  test('Wrong timeLock', () => {
    expect(
      bytesToString(
        open(
          new Args()
            .add(20000000000000 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('ox345266')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(
      bytesToString(expire(new Args().add('6').serialize())),
    ).toStrictEqual(`Wrong timeLock for this swap`);
  });
  test('Expire Swap', () => {
    expect(
      bytesToString(
        open(
          new Args()
            .add(1 as u64)
            .add(40 as u64)
            .add('ox345266')
            .add('ox345266')
            .serialize(),
        ),
      ),
    ).toStrictEqual('Swap was successfully opened');
    expect(
      bytesToString(expire(new Args().add('4').serialize())),
    ).toStrictEqual(`Swap expired`);
  });
});

describe('Get swap test', () => {
  test('Swap not exist', () => {
    expect(
      currentSwap().toString(),
    ).toStrictEqual(`7`);
  });
});
