//file system i/o

var chokidar = require('chokidar');

var FileInput = function(T, path, options) {
	/*
	path is file or directory to watch

	options:
		maxFileSize: bytes, default=10k
		keyPrefix: prefix to attach to watched files, default="file:"
		enableBinary: if enabled, binary files will be base64 encoded
	*/

}

var FileOutput = function(T, path, options) {
	/*
	options:
		maxTotalSize: do not exceed limit of all files in target path
		keyPrefix: only write files with keyPrefix as prefix, default="file:"
		peerFilePrefix: include peer in ouptut file name; if false, peers will be able to overrwrite each other's results; if true, will maintain spearate copies of peer's files
		peerSubdirectory: if true, store each peer's results in different subdirectories
	*/
}

var FileSync = function(T, path, options) {
	FileInput(T, path, { /* .. */  });
	FileOutput(T, path, { /* .. */ });
}


/*
//https://github.com/paulmillr/chokidar

var chokidar = require('chokidar');

var watcher = chokidar.watch('file or dir', {ignored: /[\/\\]\./, persistent: true});

watcher
  .on('add', function(path) {console.log('File', path, 'has been added');})
  .on('addDir', function(path) {console.log('Directory', path, 'has been added');})
  .on('change', function(path) {console.log('File', path, 'has been changed');})
  .on('unlink', function(path) {console.log('File', path, 'has been removed');})
  .on('unlinkDir', function(path) {console.log('Directory', path, 'has been removed');})
  .on('error', function(error) {console.error('Error happened', error);})

// 'add', 'addDir' and 'change' events also receive stat() results as second argument.
// http://nodejs.org/api/fs.html#fs_class_fs_stats
watcher.on('change', function(path, stats) {
  console.log('File', path, 'changed size to', stats.size);
});

watcher.add('new-file');
watcher.add(['new-file-2', 'new-file-3']);

// Only needed if watching is persistent.
watcher.close();

*/
