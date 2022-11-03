import {hash} from "./hash.ts";

async function getJson(filePath: string): Promise<Record<string,unknown>> {
    return JSON.parse(await Deno.readTextFile(filePath));
}

const cacheFiles: Deno.DirEntry[] = []
//read cache
for await (const sourceFolder of Deno.readDir('.deno/deps/https')) {
    for await (const sourceFile of Deno.readDir(`.deno/deps/https/${sourceFolder.name}`)) {
        // console.log(sourceFile)
        cacheFiles.push(sourceFile)
    }
}

const lockFile = await getJson("lock.json")

const sourcesUrls = Object.keys(lockFile)

const notFound: {url:string; sha256:string}[] = [];
sourcesUrls.forEach(url=>{
    const sha256 = hash(new URL(url));
    if(!cacheFiles.find(f=>f.name===sha256)){
        console.log("sha not found", sha256)
        notFound.push({url,sha256})
    }

})
console.log(notFound)
// --> imcomplete cache