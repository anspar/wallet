const ANS = {
    contract: null,
    setup: async function () {
        if (!await WALLET.is_ready()) return;
        if (!await HOSQ.is_ready()) return;
        this.contract = WALLET.setup_contract(ANS_ABI.ans.networks, ANS_ABI.ans.abi, "ANS");
        if (this.contract === null) return;
    },
    is_ready: function () {
        if (this.contract === null) {
            // showMsg("ANS provider is not ready, is wallet connected?", "danger", 5);
            return false
        };
        return true
    },
    getDefaultANS: async function () {
        if (!this.is_ready()) throw "ANS not ready";
        let default_ans = await this.contract.get_default(WALLET.user_address);
        if (default_ans.length < 2 || default_ans[0] === "") throw "ans contract response invalid";
        let content = await HOSQ.get(`${default_ans[1]}/info.json`)
        if (content.status !== 200) throw "ans get cid status !200";
        return [default_ans, await content.json()]
    }
}