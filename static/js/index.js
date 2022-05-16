const WALLET = {
    web3: null,
    user_address: null,
    ans: null,
    setup: async function(){
        if(!await this.is_ready()) return;
        
        if(!await this.is_contract_ready()) return;
        
        await this._update_user(false);
        this.web3.on("accountsChanged", async (accounts)=>{
            await this._update_user(false);
        });
        document.querySelector("#arag_wallet").addEventListener("click", async()=>{
            await this._update_user(true);
        })

    },
    _update_user: async function(forceEdit){
        this.user_address = this.web3.selectedAddress;
        try{
            let data = await this.is_ans_available(forceEdit);
            console.log(data, data[1].background_color);
            document.querySelector("#arag_wallet>img").src = `${IPFS_GATEWAY}/${data[0]}/${data[1].image}`;
            document.querySelector("#arag_wallet>span").innerHTML = data[1].name.length>7?`${data[1].name.substring(0,5)}..`:data[1].name;
            document.querySelector("#arag_wallet").style.setProperty("background", data[1].background_color);
        }catch(e){
            document.querySelector("#arag_wallet span").innerHTML = `${this.user_address.substring(0,3)}..${this.user_address.substring(this.user_address.length-2, this.user_address.length)}`;
        }
    },
    is_ready: async function(){
        if(window.ethereum===undefined){
            alert("Error: Wallet not detected!");
            return false
        } 
        
        this.web3 = window.ethereum;
        return (await this.web3.enable()).length>0
    },
    is_contract_ready: async function(){
        if(!await this.is_ready()){
            return false
        }
        if(this.ans!==null)return true;

        try{
            this.ans = this.setup_contract(ANS_ABI.networks[this.web3.networkVersion].address, ANS_ABI.abi);
            return true
        }catch(e){
            console.error(e);
            return false
        }
    },
    setup_contract: function(address, abi){
        let p = new ethers.providers.Web3Provider(this.web3);
        return new ethers.Contract(address, abi, p);
    },
    _ask_user_own_ans: async function(){
        document.querySelector("#arag_wallet_modal").style.setProperty("display", "flex");
        return new Promise((res, rej)=>{
            document.querySelectorAll("#arag_wallet_modal div[q1]>div>span")[0]
            .addEventListener("click", ()=>{
                localStorage.setItem("ans", JSON.stringify({available:false}));
                document.querySelector("#arag_wallet_modal").style.setProperty("display", "none");
                rej()
            });

            document.querySelectorAll("#arag_wallet_modal div[q1]>div>span")[1]
            .addEventListener("click", ()=>{
                res(true)
            });
        })
    },
    _get_user_ans: async function(forceEdit){
        let self = this;
        const show_modal = ()=>{
            document.querySelector("#arag_wallet_modal").style.setProperty("display", "flex");
            document.querySelector("#arag_wallet_modal div[q1]").style.setProperty("display", "none");
            document.querySelector("#arag_wallet_modal div[q2]").style.setProperty("display", "flex");
        };
        let ans = JSON.parse(localStorage.getItem("ans"));
        if(ans?.available && !forceEdit){
            document.querySelector("#arag_wallet_modal div[q2]>input").value = ans?.ans;
        }else{
            show_modal();
        }

        return new Promise(async(resolve, rej)=>{
            document.querySelectorAll("#arag_wallet_modal div[q2]>div>span")[0]
            .addEventListener("click", ()=>{
                document.querySelector("#arag_wallet_modal").style.setProperty("display", "none");
                rej()
            });

            const submit = async()=>{
                let user_ans = document.querySelector("#arag_wallet_modal div[q2]>input").value;
                let u = await self.ans.functions.who_is(user_ans);
                if(u[0][1].toLowerCase()!==self.user_address.toLowerCase()){
                    show_modal();
                    alert("You don't own this ANS.");
                    return
                }
                fetch(`${IPFS_GATEWAY}/${u[0][2]}/info.json`).then(res=>{
                    res.json().then(data=>{
                        localStorage.setItem("ans", JSON.stringify({available:true, ans:user_ans}));
                        document.querySelector("#arag_wallet_modal").style.setProperty("display", "none");
                        resolve([u[0][2], data]);
                    })
                }).catch((e)=>{alert("Failed to get ANS data from IPFS: "+e)});
            };
            if(ans?.available && !forceEdit){
                await submit();
            }
            document.querySelectorAll("#arag_wallet_modal div[q2]>div>span")[1]
            .addEventListener("click", async(e)=>{
                let inner = e.target.innerHTML;
                e.target.innerHTML = "...";
                await submit();
                e.target.innerHTML = inner;
            });
        })
    },
    is_ans_available: async function(forceEdit){
        let self = this;
        return new Promise(async (res, rej)=>{
            let ans = JSON.parse(localStorage.getItem("ans"));
            if(ans==null){
                try{
                    await self._ask_user_own_ans();
                }catch{
                    rej();
                    return
                }
            }else if(!ans.available && !forceEdit){
                rej();
                return
            }
            try{
                res(await self._get_user_ans(forceEdit));
            }catch{
                rej();
            }
            
            rej();
            return
            
        })
    }
};

document.addEventListener("DOMContentLoaded", async function(){
    await WALLET.setup();
})