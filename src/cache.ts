import { createCache } from "https://deno.land/x/deno_cache/mod.ts";
import { createGraph } from "https://deno.land/x/deno_graph/mod.ts";

// create a cache where the location will be determined environmentally
const cache = createCache();
// destructuring the two functions we need to pass to the graph
const { cacheInfo, load } = cache;
// create a graph that will use the cache above to load and cache dependencies
const graph = await createGraph("https://deno.land/x/oak@v9.0.1/mod.ts", {
  cacheInfo,
  load,
});

// log out the console a similar output to `deno info` on the command line.
console.log(graph.toString());