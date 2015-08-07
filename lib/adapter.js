
var md_tpl = '[{title}]({link})';

function markdown(arr) {
  return md_tpl.replace('{title}',arr[0]).replace('{link}', arr[1]);
}

function txt(arr) {
  return arr.join('\n');
}

exports.generate = function generate(arr, ext) {
  switch (ext) {
    case 'txt':
      return txt(arr);
      break;
    case 'md':
      return markdown(arr);
      break;
  }
};