#!/usr/bin/env node

const path = require('path');
const fs=require('fs');
const child_process=require('child_process');
const merge=require('merge');
const shelljs=require('shelljs');

function exists(file_path){
  try{
    fs.accessSync(file_path, fs.constants.R_OK);
    return true;
  }catch(e){}
  return false;
}

var cwd=process.cwd();
var sub_module_path=`${cwd}/sub_module.json`;
if(exists(sub_module_path)){
  var sub_module=JSON.parse(fs.readFileSync(sub_module_path));
  var target={dependencies:{}, devDependencies:{}};
  var own_module={};
  var cwd_bin_path=path.join(cwd,'node_modules/.bin');
  for(var dir_name of sub_module.sub_module){
    var package_path=path.join(cwd, dir_name, 'package.json');
    if(exists(package_path)){
      var nm_path=path.join(path.dirname(package_path), 'node_modules');
      shelljs.mkdir('-p', nm_path);
      var ln_path=path.relative(nm_path, cwd_bin_path);
      shelljs.ln('-sf', ln_path, path.join(nm_path, '.bin'))
      var package_json=JSON.parse(fs.readFileSync(package_path));
      if(package_json.name){
        own_module[package_json.name]=true;
      }
      Object.assign(target.dependencies, package_json.dependencies);
      Object.assign(target.devDependencies, package_json.devDependencies);
    }
  }
  for(var i in target.dependencies){
    if(own_module[i] || /^\.*\//.test(target.dependencies[i])){
      delete target.dependencies[i];
    }
  }
  for(var i in target.devDependencies){
    if(own_module[i] || /^\.*\//.test(target.devDependencies[i])){
      delete target.devDependencies[i];
    }
  }
  target=merge.recursive({name:path.basename(cwd), version:'0.0.1'}, sub_module, target);
  fs.writeFileSync('package.json', JSON.stringify(target, null, 2));
  var npm_install=child_process.spawn('npm', ['install'], {stdio:'inherit'});
}
