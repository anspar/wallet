const WALLET = {
    _provider: null,
    _web3Modal: null,
    _instance: null,
    user_address: null,
    network: null,
    providerOptions: {},
    setup: async function () {
        this._web3Modal = new Web3Modal.default({
            cacheProvider: true,
            providerOptions: this.providerOptions,
        });

        if (this._web3Modal.cachedProvider) {
            await this.connect()
        }
    },
    connect: async function () {
        $("div#arag_wallet").addClass("loading");
        try {
            if (this._web3Modal === null) throw "web3Modal is null, did you call 'setup'?";
            this._instance = await this._web3Modal.connect();

            this._provider = new ethers.providers.Web3Provider(this._instance);
            await this.updateDetails();

            this._instance.on("accountsChanged", async (accounts) => {
                if (accounts.length === 0) { this.disconnect(); return; }
                try {
                    $("div#arag_wallet").addClass("loading");
                    await this.updateDetails(this.showANS);
                    $("div#arag_wallet").removeClass("loading");
                } catch (e) { console.error(e); $("div#arag_wallet").removeClass("loading"); }
            });

            this._instance.on("chainChanged", async (chainId) => {
                this._instance.removeAllListeners();
                this.setup();
                this.connect();
            });

            await HOSQ.setup();
            if (HOSQ.is_ready()) await ANS.setup();
            this.showANS();
            $("div#arag_wallet").removeClass("loading");
        } catch (e) {
            console.error(e);
            $("div#arag_wallet").removeClass("loading");
        }
    },
    updateDetails: async function (callback) {
        this.user_address = (await this.getProvider().listAccounts())[0];
        this.network = await this.getProvider().getNetwork();
        $("div#arag_wallet>span").html(`${this.addressToShort(this.user_address)}`);
        $("div#arag_wallet").css("background-color", "var(--ar-light)");
        $("div#arag_wallet>img").attr("src", ` `);
        if (typeof callback === "function") callback(this.network, this.user_address);
    },
    getSigner: function () {
        return this.getProvider().getSigner()
    },
    disconnect: async function () {
        await this._web3Modal.clearCachedProvider();
        window.location.reload();
    },
    getProvider: function () {
        if (this._provider === null) throw "Provider not available, did you call 'connect'?";
        return this._provider;
    },
    addressToShort: function (address) {
        if (address.length !== 42) throw "Not evm address";
        return `${address.substring(0, 3)}..${address.substring(38, 42)}`
    },
    setup_contract: function (networks, abi, contarctName) {
        if (networks[this.network.chainId] === undefined || networks[this.network.chainId] === null) {
            showMsg(`${contarctName} is not available on '${this.network.name}' chain`, "warning", 10);
            return null;
        }
        return new ethers.Contract(networks[this.network.chainId], abi, this.getSigner());
    },
    is_ready: async function () {
        try {
            return (await this.getProvider().listAccounts()).length > 0
        } catch (e) {
            console.error(e);
            showMsg("Please Connect Your Wallet", "warning", 10);
            return false
        }
    },
    showANS: async function () {
        // console.log(ans);
        if (!ANS.is_ready()) return;
        let ans = await ANS.getDefaultANS();
        $("div#arag_wallet>span").html(ans[1].name.length > 10 ? ans[1].name.substring(0, 10) : ans[1].name)
        $("div#arag_wallet").css("background-color", ans[1].background_color);
        $("div#arag_wallet>img").attr("src", `${HOSQ.gateway}/${ans[0][1]}/${ans[1].image}`);
    },
};

$(document).ready(async () => {
    $("div#arag_wallet").on("click", async function () {
        if (WALLET._provider !== null) $("div#arag_wallet_modal").addClass("d-flex").removeClass("d-none");
        else await WALLET.connect();
    })
})