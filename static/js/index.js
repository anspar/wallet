const WALLET = {
    web3: null,
    user_address: null,
    ans: null,
    setup: async function(){
        document.querySelector("#arag_wallet").addEventListener("click", async()=>{
            if(!await this.is_ready()) return;
            if(!await this.is_contract_ready()) return;
            await this.update_user_ans(true);
        })

        if(!await this.is_ready()) return;
        
        if(!await this.is_contract_ready()) return;
        
        await this.update_user_ans(false);
        this.web3.on("accountsChanged", async (accounts)=>{
            await this.update_user_ans(false);
        });
    },
    update_user_ans: async function(forceEdit){
        this.user_address = this.web3.selectedAddress;
        document.querySelector("#arag_wallet").classList.add("loading")
        try{
            let data = await this.is_ans_available(forceEdit);
            if(data[1].image!=="" || typeof data[1].image!=="undefined"){
                document.querySelector("#arag_wallet>img").src = `${IPFS_GATEWAY}/${data[0]}/${data[1].image}`;
            }
            document.querySelector("#arag_wallet>span").innerHTML = data[1].name.length>7?`${data[1].name.substring(0,5)}..`:data[1].name;
            document.querySelector("#arag_wallet").style.setProperty("background", data[1].background_color);
        }catch(e){
            // console.error(e);
            document.querySelector("#arag_wallet span").innerHTML = `${this.user_address.substring(0,3)}..${this.user_address.substring(this.user_address.length-2, this.user_address.length)}`;
        }
        document.querySelector("#arag_wallet").classList.remove("loading")
    },
    is_ready: async function(){
        if(window.ethereum===undefined){
            alert("Error: Wallet not detected!");
            return false
        } 
        
        try{
            this.web3 = window.ethereum;
            return (await this.web3.request({
                method: 'eth_requestAccounts'
            })).length>0
        }catch(e){
            console.error(e);
            return false
        }
    },
    is_contract_ready: async function(){
        if(!await this.is_ready()){
            return false
        }
        if(this.ans!==null)return true;

        try{
            if(ANS_ABI.networks[this.web3.networkVersion]===undefined){
                alert(`ANS is not available for chain with id "${this.web3.networkVersion}" `)
                return false
            }
            this.ans = this.setup_contract(ANS_ABI.networks[this.web3.networkVersion].address, ANS_ABI.abi);
            return true
        }catch(e){
            console.error(e);
            return false
        }
    },
    setup_contract: function(address, abi){
        let p = new ethers.providers.Web3Provider(this.web3);
        return new ethers.Contract(address, abi, p.getSigner(0));
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
                    localStorage.removeItem("ans");
                    alert(`You don't own '${user_ans}' ANS`);
                    show_modal();
                    return
                }
                try{
                    let res = await fetch(`${IPFS_GATEWAY}/${u[0][2]}/info.json`)
                    let data = await res.json()
                    localStorage.setItem("ans", JSON.stringify({available:true, ans:user_ans}));
                    document.querySelector("#arag_wallet_modal").style.setProperty("display", "none");
                    resolve([u[0][2], data]);
                }catch(e){
                    alert("Failed to get ANS data from IPFS: "+e)
                    return
                };
            };
            if(ans?.available && !forceEdit){
                await submit();
            }
            
            const user_submit = async()=>{
                document.querySelector("#arag_wallet_modal div[q2]>input").classList.add("loading")
                await submit();
                document.querySelector("#arag_wallet_modal div[q2]>input").classList.remove("loading")
            }

            document.querySelectorAll("#arag_wallet_modal div[q2]>div>span")[1]
            .addEventListener("click", async(e)=>{
                await user_submit() //todo dispatches twice 
            });

            document.querySelector("#arag_wallet_modal div[q2]>input")
            .addEventListener("keyup", async(e)=>{
                if (e.key === "Enter") {
                    await user_submit() //todo dispatches twice
                }
            });
        })
    },
    is_ans_available: async function(forceEdit){
        let self = this;
        return new Promise(async (res, rej)=>{
            if(typeof IPFS_GATEWAY === 'undefined' || IPFS_GATEWAY===null) {
                console.error("IPFS_GATEWAY is", IPFS_GATEWAY);
                rej(); 
                return
            }

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
    if(typeof ethers === "undefined") {
        alert("'ethers' Object Not found")
    }
})