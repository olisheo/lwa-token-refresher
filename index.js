const program = require('commander');
const axios = require('axios');
const fs = require('fs');
const { exit } = require('process');

// LWA Info JSON file format
//
// {
//     "tokenEndpoint": "https://api.amazon.co.jp/auth/o2/token",
//     "clientId": "amzn1.application-oa2-client.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
//     "clientSecret": "fjiewfjewfwfsdjfjfkl;gj90r329r4repogppijrgjefjwfweweferjfer",
//     "refresh_token": "Atzr|fewiofeorji9gw0r932i-fkerjgiojreogj9rekjpofjwpao"
// }

const loadInfoFile = (infoJsonFilePath) => {
    const buf = fs.readFileSync(infoJsonFilePath);
    return JSON.parse(buf.toString());
};

const doRefreshToken = async (lwaInfo) => {
    const resFromLwaTokenendpoint = await axios({
        method: "post",
        url: lwaInfo.tokenEndpoint,
        data: {
            grant_type: "refresh_token",
            client_id: lwaInfo.clientId,
            client_secret: lwaInfo.clientSecret,
            refresh_token: lwaInfo.refresh_token,
        },
    });
    return resFromLwaTokenendpoint;
};

const makeOutputData = (data, needAccessToken, needRefreshToken) => {
    if (needAccessToken && needRefreshToken) {
        return { access_token: data.access_token, refresh_token: data.refresh_token };
    } else {
        if (needAccessToken) {
            return data.access_token;
        }
        if (needRefreshToken) {
            return data.refresh_token;
        }
        return data;
    }
};

(() => {
    program.description('Tool to refresh LWA token. requires client ID, client secret and refresh token.')
        .requiredOption('-i, --info-file <path to LWA information JSON file>', 'Information file for LWA client')
        .option('-t', 'output access token only')
        .option('-r', 'output refresh token only')
        .parse(process.argv);
    const opts = program.opts();

    // opts.infoFile    string: Path to JSON file that has LWA client information and refresh token.
    // opts.t           boolean: true if user needs access token in output.
    // opts.r           boolean: true if user needs refresh token in output.

    if (opts.t && opts.r) {
        console.error("you can't use -t flag and -r flag in the same command. if you need both access and refresh token, execute the command without a flag.");
        return 1;
    }
    const info = loadInfoFile(opts.infoFile);
    doRefreshToken(info).then(res => {
        const out = makeOutputData(res.data, opts.t, opts.r);
        console.log(out);
    });
})();