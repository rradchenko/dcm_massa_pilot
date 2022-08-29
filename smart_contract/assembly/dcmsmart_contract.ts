import { generateEvent, include_base64, toBase58, createSC, Storage, print, Address, publicKeyToAddress, Context } from "massa-sc-std";

function createContract(): Address {
    const bytes = include_base64('./build/dcmsmart_contract.wasm');
    const sc_address = createSC(bytes);
    return sc_address;
}

function events(_args: string): i32 {
    generateEvent(_args);
    return 0;
}

function setStorage(name: string, value: string): i32 {
    const addresses = Context.addressStack();
    Storage.setOf(addresses[1], name, value);
    print("done");
    return 0;
}

function setListToStorage(name: string, image: string, title: string): i32 {
    const addresses = Context.addressStack();
    print("ListOfArticles");
    print(Storage.has(`ListOfArticles`).toString());
    if (Storage.has(`ListOfArticles`)) {
        Storage.appendOf(addresses[1], `ListOfArticles`, name + '|' + image + '|' + title + '||');
        print("1");
    } else {
        Storage.setOf(addresses[1], `ListOfArticles`, name + '|' + image + '|' + title +  '||');
        print("2");
    }
    print("done");
    return 0;
}

export function main(_args: string): void {
    const sc_address = createContract();
    print("Created smart-contract!!!");
    events("Created smart-contract at:" + sc_address._value);
    events("SC_Address:" + sc_address._value);
}

export function setData(_args: string): string {
    print('set_data');
    let args = _args.split("|");
    if (args.length) {
        setStorage(args[1], args[2]);
        setListToStorage(args[1], args[3], args[4]);
        print('send Data' + args[1]);
        events("sended data" + args[1]);
    }
    return _args;
}

export function appendData(_args: string): string {
    print('append_data');
    const addresses = Context.addressStack();
    let args = _args.split("|");
    if (args.length) {
        Storage.appendOf(addresses[1], args[1], args[2]);
        print('append Data' + args[1]);
        events("appended data" + args[1]);
    }
    return _args;
}

export function readData(_args: string): string {
    let args = _args.split("|");
    if (args.length) {
        const texx = Storage.get(args[1])
        events(texx.toString());
        print(texx.toString());
        print('readData-' + args[1])
        return args[0] + '-' + args[1] + '-' + texx;
    } else {
        return _args;
    }
}