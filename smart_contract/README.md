# DCM Smart Contract

npm install

Create file in build folder - dcmsmart_contract.wasm

## Build

npx massa-sc-scripts build-sc assembly/dcmsmart_contract.ts

## Sending smart contract

send_smart_contract <your_address> path/to/dcmsmart_contract.wasm 100000000 0 0 0

## Decentralized web smart-contract

Create file in build folder - scwebsite.wasm

Change path to website in assembly/scwebsite.ts

npx massa-sc-scripts build-sc assembly/scwebsite.ts

send_smart_contract <your_address> path/to/scwebsite.wasm 100000000 0 0 0
