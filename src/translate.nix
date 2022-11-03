let  
  lib = import <nixpkgs/lib>;
  lockfile = ../lock.json;
  jsonContent = builtins.fromJSON (builtins.readFile lockfile);
  dependencies = builtins.mapAttrs (url: hash: 
    let 
      splitUrl = builtins.split "@" url;
      version  = "v1";
    in {
      ${version} = {
        inherit splitUrl;
        "hash" = hash;
        "type"= "http";
        "url"= url;
    };   
  }) jsonContent;
in { 
  inherit lockfile jsonContent dependencies;
}
