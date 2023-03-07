/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
import { Args, Result, Serializable } from "@massalabs/as-types";

// define class OpenSwapRequest to work with open function
export class OpenSwapRequest implements Serializable {
    constructor(
        public timeLock: u64 = 0,
        public massaValue: u64 = 0,
        public withdrawTrader: string = '',
        public secretLock: StaticArray<u8> = [],
    ) { }

    public serialize(): StaticArray<u8> {
        const args = new Args();
        args.add(this.timeLock);
        args.add(this.massaValue);
        args.add(this.withdrawTrader);
        args.add(this.secretLock);
        return args.serialize();
    }

    public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
        const args = new Args(data, offset);
        this.timeLock = args
            .nextU64()
            .expect("Can't deserialize OpenSwapRequest.timeLock");
        this.massaValue = args
            .nextU64()
            .expect("Can't deserialize OpenSwapRequest.massaValue");
        this.withdrawTrader = args
            .nextString()
            .expect("Can't deserialize OpenSwapRequest.withdrawTrader");
        this.secretLock = args
            .nextBytes()
            .expect("Can't deserialize OpenSwapRequest.secretLock");

        return new Result(args.offset);
    }
}

// -------------------------------------------------------------------------------------- //

// define class CloseSwapRequest to work with close function
export class CloseSwapRequest implements Serializable {
    constructor(public swapID: string = '', public secretKey: StaticArray<u8> = []) { }

    public serialize(): StaticArray<u8> {
        const args = new Args();
        args.add(this.swapID);
        args.add(this.secretKey);
        return args.serialize();
    }

    public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
        const args = new Args(data, offset);
        this.swapID = args
            .nextString()
            .expect("Can't deserialize CloseSwapRequest.swapID");
        this.secretKey = args
            .nextBytes()
            .expect("Can't deserialize CloseSwapRequest.secretKey");

        return new Result(args.offset);
    }
}

// -------------------------------------------------------------------------------------- //

// define class ExpireSwapRequest to work with expire function
export class ExpireSwapRequest implements Serializable {
    constructor(public swapID: string = '') { }

    public serialize(): StaticArray<u8> {
        const args = new Args();
        args.add(this.swapID);
        return args.serialize();
    }

    public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
        const args = new Args(data, offset);
        this.swapID = args
            .nextString()
            .expect("Can't deserialize ExpireSwapRequest.swapID");

        return new Result(args.offset);
    }
}

// -------------------------------------------------------------------------------------- //

// define class SwapRequest to work with expire function
export class SwapRequest implements Serializable {
    constructor(public swapID: string = '') { }

    public serialize(): StaticArray<u8> {
        const args = new Args();
        args.add(this.swapID);
        return args.serialize();
    }

    public deserialize(data: StaticArray<u8>, offset: i32 = 0): Result<i32> {
        const args = new Args(data, offset);
        this.swapID = args
            .nextString()
            .expect("Can't deserialize SwapRequest.swapID");

        return new Result(args.offset);
    }
}