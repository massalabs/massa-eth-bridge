/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
import { Args, Result, Serializable } from "@massalabs/as-types";

// define class SWAP
export class SWAP implements Serializable {
    constructor(
        public state: string = 'INVALID',
        public timeLock: u64 = 0,
        public massaValue: u64 = 0,
        public trader: string = '',
        public withdrawTrader: string = '',
        public secretLock: StaticArray<u8> = [],
        public secretKey: StaticArray<u8> = [],
    ) { }

    public serialize(): StaticArray<u8> {
        const args = new Args();
        args.add(this.state);
        args.add(this.timeLock);
        args.add(this.massaValue);
        args.add(this.trader);
        args.add(this.withdrawTrader);
        args.add(this.secretLock);
        args.add(this.secretKey);
        return args.serialize();
    }

    public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
        const args = new Args(data, offset);
        this.state = args.nextString().expect("Can't deserialize SWAP.state");
        this.timeLock = args.nextU64().expect("Can't deserialize SWAP.timeLock");
        this.massaValue = args
            .nextU64()
            .expect("Can't deserialize SWAP.massaValue");
        this.trader = args
            .nextString()
            .expect("Can't deserialize SWAP.trader");
        this.withdrawTrader = args
            .nextString()
            .expect("Can't deserialize SWAP.withdrawTrader");
        this.secretLock = args
            .nextBytes()
            .expect("Can't deserialize SWAP.secretLock");
        this.secretKey = args
            .nextBytes()
            .expect("Can't deserialize SWAP.secretKey");

        return new Result(args.offset);
    }
}