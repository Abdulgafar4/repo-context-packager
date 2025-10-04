import TOML from "smol-toml"
import fs from "fs"
import path from "path"


export interface ConfigOptions{
     output?: string,
     include?: string,
     exclude?: string,
     tokens?: boolean,
     maxFileSize?: number,
     maxTokens?: number,
     summary?: boolean,
     recent?: number,
     verbose?: boolean
}

const CONFIG_FILENAME = '.repoPackager.toml';
/*
  Load configuration from TOML config file in the specified directory.
  Returns empty object if no config file exists.
  Exits with error if config file exists but cannot be parsed.
 */

 export function loadConfig(chosenDir:string = process.cwd()){
     const pathToConfig = path.join(chosenDir,CONFIG_FILENAME);

     if(!fs.existsSync(pathToConfig)){
       return {};
     }

     try{

      const fileContent = fs.readFileSync(pathToConfig,"utf-8");
      const parsed = TOML.parse(fileContent) as any;
      //Extracting only recognized options and ignoring others
      const config:ConfigOptions = {};
      
      if(typeof parsed.output === "string"){
       config.output = parsed.output;
      }
      
      if(typeof parsed.include === "string"){
       config.include = parsed.include;
      }
      
      if(typeof parsed.exclude === "string"){
       config.exclude = parsed.exclude;
      }
      
      if(typeof parsed.tokens === "boolean"){
       config.tokens = parsed.tokens;
      }
       
      if(typeof parsed.maxFileSize === "number"){
       config.maxFileSize = parsed.maxFileSize;
      }
      
      if(typeof parsed.maxTokens === "number"){
       config.maxTokens = parsed.maxTokens;
      }

      if (typeof parsed.summary === 'boolean') {
      config.summary = parsed.summary;
    }
    
    if (typeof parsed.recent === 'number') {
      config.recent = parsed.recent;
    }
    
    if (typeof parsed.verbose === 'boolean') {
      config.verbose = parsed.verbose;
    }

     return config; 
     }catch(error:any){
       console.error(`Error: Unable to parse TOML file: ${CONFIG_FILENAME}`);
       console.error(`Details:${error.message}`);
       process.exit(1);
     }

 }