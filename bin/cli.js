#!/usr/bin/env node

'use strict';

var cmd = require('commander');
var info = require('../package.json');
var exp = require('../lib/cnode-exp');

cmd
  .version(info.version)
  .usage('[options] <username>')
  .option('-m, --markdown', 'export as a markdown file')
  .parse(process.argv);

if (cmd.args.length != 1) {
  cmd.help();
}

var ext = 'txt';

ext = cmd.markdown ? 'md' : ext;

exp(cmd.args[0], ext);