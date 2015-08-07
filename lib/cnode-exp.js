'use strict';

var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var req = require('request');
var cheerio = require('cheerio');
var adapter = require('./adapter');

var event = new EventEmitter();
var domain = 'https://cnodejs.org';
var url_tpl = domain + '/user/{username}/collections?page={pageNo}';
var filename_tpl = 'topic_collection_{username}.{ext}';
var page_count;//总共页数
var current_page = 1;

var SELECTOR_TOPIC = '#topic_list .cell a.topic_title';//主题列表选择器
var SELECTOR_PAGINATION = '.pagination ul li:last-child a';//最大页码选择器

var options = {
  url: '',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/42.0.2311.152 Safari/537.36'
  }
};

/*
 * 导出步骤：
 *
 *  1.根据username找到用户收藏页，抓取第一页列表，并抓取到最后一页的页码(pagination最后一页的链接)
 *  2.判断是否有多页，有则抓取
 *  3.根据导出格式写文件
 */

event.on('fetch_done', function(body, username, ext){
  var filename = filename_tpl
    .replace('{username}', username)
    .replace('{ext}', ext);
  var resultArr = parseTopicList(body);
  parseTotalPage(body);
  if (page_count === 0) {
    console.log('该用户并没有收藏主题.');
    process.exit(1);
  }
  writeToFile(resultArr, filename, ext);
  current_page++;
  if (current_page <= page_count) {
    var url = url_tpl
      .replace('{username}', username)
      .replace('{pageNo}', current_page);
    fetch(url, username, ext)
  } else {
    console.log('抓取完毕...');
    console.log('导出路径:' + (require('path').join(process.cwd(), filename)));
  }
});

/**
 * 请求url
 * @param {String} url 请求的url
 * @param {String} username 用户名
 * @param {String} ext 导出的扩展名
 */
function fetch(url, username, ext) {
  options.url = url;
  req(options, function(err, res, body) {
    event.emit('fetch_done', body, username, ext);
  });
  console.log('正在抓取第' + current_page + '页...');
}

/**
 * 解析文章列表
 * @param {String} content
 * @return {Array}
 */
function parseTopicList(content) {
  var topicArr = [];
  var $ = cheerio.load(content, {normalizeWhitespace: true});
  var $topicArr = $(SELECTOR_TOPIC);
  console.log('本页主题数:', $topicArr.length);
  $topicArr.each(function(i, topic) {
    var link = $(topic).attr('href');
    link = link.indexOf('http') !== -1
      ? link
      : domain + link;
    //console.log('link', link);
    //console.log('text', $(topic).text());
    topicArr.push([$(topic).text(), link]);
  });
  return topicArr;
}

/**
 * 解析最大页码
 * @param content
 */
function parseTotalPage(content) {
  if (!page_count) {
    var $ = cheerio.load(content, {normalizeWhitespace: true});
    var $lastPage = $(SELECTOR_PAGINATION);
    //console.log('总页数:', $lastPage.length);
    page_count = $lastPage.length === 0
      ? 0
      : $lastPage.length;
    if (page_count === 0) return;
    $lastPage.each(function(i, p) {
      var count = parseInt(String.prototype.substr.call($(p).attr('href'), -1), 10);
      page_count = !isNaN(count) ? count : 0;
      console.log('总页数:', page_count);
    });
  }
}

function writeToFile(topicArr, filename, ext) {
  var topicStrArr = topicArr.map(function(item) {
    return adapter.generate(item, ext);
  });
  fs.appendFileSync(filename, topicStrArr.join('\n\n'));
}

/**
 * 导出操作
 * @param {String} name 在cnode社区的用户名
 * @param {String} ext 扩展名
 * @type {Function}
 */
exports = module.exports = function exp(username, ext) {
  //未替换页码的url
  var url = url_tpl
    .replace('{username}', username)
    .replace('{pageNo}', current_page);
  console.log('开始抓取...');
  //最终输出文件名
  fetch(url, username, ext);
};