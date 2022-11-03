//simple library to explain how files beeing named in the deno cache
// import secunetThemeOptions from "https://git.seven.secucloud.secunet.com/cloud-and-workbench/secunet-theme/-/blob/main/src/components/secunetThemeOptions/secunetThemeOptions.ts";
// SqPSkEMGYVutkxaU-v1p
// console.log({secunetThemeOptions})

import { createHash } from "https://deno.land/std@0.161.0/node/crypto.ts";

function hash(url: URL): string {
    const urlInfo = `${url.pathname}${url.search ? '?' + url.search : ''}`
    if(urlInfo.includes("math")){

        console.log({urlInfo})
    }
    return createHash('sha256').update(urlInfo).digest().toString('hex')
}

const url = new URL("https://deno.land/x/math@v1.1.0/mod.ts")
const sha = hash(url)

console.log({sha, url})

export {hash};