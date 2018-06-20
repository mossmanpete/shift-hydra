import config from './config.global.mjs';

/**
 * CONFIGURATION
 */
config.exportPath = 'export/data/';
config.ignoreFolders = ['img'];
config.port = 8000;
config.getIPFS = 'http://49053.s.time4vps.cloud:9405/api/dapps/918577358511643863/api/data';
config.getIPFSFile = config.getIPFS + '/get';
config.getIPFSFolder = config.getIPFS + '/list';
config.createIPFSFile = config.getIPFS + '/add';
config.deleteIPFSFile = config.getIPFS + '/del';

// http://49053.s.time4vps.cloud:9405/api/dapps/918577358511643863/api/data/list?hash=QmWrbqRPd7Dnesw7aU41nrbg5u9csx75bobxE1Qc3v7dpf&path=donations

export default config;