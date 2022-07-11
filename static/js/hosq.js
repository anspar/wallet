const HOSQ = {
    contract: null,
    provider: null,
    gateway: null,
    setup: async function () {
        await WALLET.until_ready();
        this.contract = WALLET.setup_contract(HOSQ_ABI.hosq.networks, HOSQ_ABI.hosq.abi, "Hosq");
        if (this.contract === null) return;

        let pid = 1;
        if (localStorage.getItem("hosq_provider") !== null) {
            pid = parseInt(localStorage.getItem("hosq_provider"));
        }
        await this.select_provider(pid);
        let self = this;
        document.querySelector("#hosq-provider-div button").addEventListener("click", async (el) => {
            let val = document.querySelector("#hosq-provider-div input").valueAsNumber;
            if (isNaN(val)) {
                showMsg(`Invalid Provider ID '${val}'`, "danger", 10);
                return
            }

            await self.select_provider(val);
        })

        setInterval(async () => {
            if (this.gateway === null) return;
            document.querySelectorAll('[ipfs]').forEach((e, i) => {
                e.setAttribute('src', `${this.gateway}/${e.getAttribute('ipfs')}`);
                e.removeAttribute('ipfs');
            })
        }, 1000)
    },
    select_provider: async function (id) {
        if (!this.is_ready()) return;
        let hp_div = $("#hosq-provider-div").addClass("loading");
        try {
            let provider = await this.contract.get_provider_details(id)
            if (provider[2] === "") {
                showMsg(`Invalid Provider "${id}"`, "danger", 10);
                $(hp_div).removeClass("loading");
                return false
            }
            document.querySelector("#hosq-provider-div input").value = id;
            document.querySelector("#hosq-provider-div span").textContent = provider[3].includes("<") ? "Invalid Name" : provider[3];
            this.gateway = provider[2] + (provider[2].endsWith("/") ? "gateway" : "/gateway");

            this.provider = provider;
            localStorage.setItem("hosq_provider", id);
            $(hp_div).removeClass("loading");
            return true
        } catch (e) {
            console.error(`Failed to select provider '${id}'`, e);
            $(hp_div).removeClass("loading");
            return false
        }
    },
    is_ready: function () {
        if (this.contract === null) {
            // showMsg("Hosq provider is not ready, is wallet connected?", "danger", 5);
            return false
        }
        return true
    },
    get: async function (cid) {
        if (!this.is_ready()) return null;
        return await fetch(`${this.gateway}/${cid}`)
    },
    upload: async function (data, json, dir, progress = null) {
        if (!this.is_ready()) return null;
        let url = this.provider[2] + (this.provider[2].endsWith("/") ? "" : "/") + (dir ? "upload_dir" : "upload");
        if (!dir) {
            const body = new FormData();
            body.append("file", data);
            data = body;
        }
        let xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        if (progress !== null) {
            xhr.upload.addEventListener("progress", function (evt) {
                //console.log(evt, evt.target);
                if (evt.lengthComputable) {
                    var percentComplete = evt.loaded / evt.total;
                    progress.update(parseInt(percentComplete * 100));
                    console.log(percentComplete);
                } else {
                    progress.processing();
                }
            }, false);
        }
        return (new Promise(function (resolve, reject) {
            xhr.onload = function () {
                if (progress !== null) { progress.hide() }
                if (this.status >= 200 && this.status < 300) {
                    let data = json ? JSON.parse(xhr.response) : xhr.response;
                    resolve({ status: this.status, data });
                } else {
                    reject({
                        status: this.status,
                        details: this
                    });
                }
            };
            xhr.send(data) // todo catch error
            if (progress !== null) { progress.show().processing() }
        }))
    },

    upload_dir: async function (files, json, dir_name = false, info = false, progress = null) {
        if (!dir_name && !info) { console.error("upload_dir requires 'dir_name' or 'info' object"); return }
        const body = new FormData();
        for (let file of files) {
            body.append("file1", file, file.name);
        }
        if (dir_name) {
            body.append("file2", new Blob([JSON.stringify({
                type: "dir",
                name: dir_name
            })]), "info.json")
        } else if (info) {
            body.append("file2", new Blob([JSON.stringify(info)]), "info.json")
        }

        return await this.upload(body, json, true, progress)
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    if (typeof WALLET === "undefined") {
        showMsg("WALLET Object Not found", "danger", 10);
        return
    }
})