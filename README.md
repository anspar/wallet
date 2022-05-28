# Wallet

## A wallet component for [Arag](https://github.com/anspar/arag) dapps.

![release](https://github.com/anspar/wallet/actions/workflows/release.yml/badge.svg?branch=main)


### Requirements 
1. [arag common libs](https://github.com/anspar/arag_common_libs)
2. [hosq provider](https://github.com/anspar/hosq_provider) or other compatible component

### Import 
1. In html file
```
    {{web_component "https://github.com/anspar/wallet/releases/download/<release-version>/build.html"}}
```
2. In arag.yml
```
    dependencies:
        - https://github.com/anspar/wallet/releases/download/<release-version>/build.html
```
#### OR
Download the `build.html` file and add it to the project with
```
    {{import_content "path/to/build.html"}}
```


### Setup wallet
This will ask user for an ANS. If user owns the ANS the profile will be loaded, otherwise wallet address will be shown.
```
document.addEventListener("DOMContentLoaded", async function(){
    await WALLET.setup();
    if(!await WALLET.is_ready()) return;
    ...

    OR
    
    if(await WALLET.is_ready()){
        ...
    }
})
```

### Available Properties
`WALLET.web3` : returns window.ethereum object

`WALLET.user_address` : returns selected user address

`WALLET.ans` : returns ANS smart contract wrapped with ethersjs library

```
document.addEventListener("DOMContentLoaded", async function(){
    await WALLET.setup();
    if(!await WALLET.is_ready()) return;
    
    if(!await WALLET.is_contract_ready()) return;

    let userDetails = await WALLET.ans.functions.who_is('user ans');

    ...

})
```
### Note
You can always get all available attributes with `Object.keys(HOSQ_PROVIDER)`
## Ask question at [Discord](https://discord.gg/ENQfPEcrZJ)

[anspar.io](https://anspar.io)
