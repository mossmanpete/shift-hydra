import axios from "axios/index";
import config from "../../../../../../../config.mjs";
import fs from 'fs';
import * as functions from "../functions.mjs";

/**
 * Checks the sync status of the folder corresponding to the hash
 * @param hash given hash of the data folder
 * @param res response object
 */
export function syncFoldersHash(syncInfo, res) {
    axios.get(config.getIPFS, {
        params: {
            hash: syncInfo.hash,
            path: syncInfo.path
        }
    })
        .then((result) => {
            if (!!result.data && !!result.data.response) {
                checkFolders(result.data.response.Objects[0].Links, res);
            } else {
                res.status(500).send('Error: Invalid result data');
            }
        })
        .catch((error) => {
            res.status(500).send(error);
            console.log(error);
        });
}

/**
 * Checks if the given folders are up-to-date with the export path
 * Returns an array with the folders that differ
 *  First item of the array is an array containing the remote directories that do not exist locally
 *  Second item of the array is an array containing the local directories that do not exist remote
 *  Third item of the array is an array containing the remote directories that are not up-to-date with local ones
 * @param folders given folders to check
 * @param res response objects
 */
function checkFolders(folders, res) {
    const directories = functions.getDirectories(config.exportPath);
    const fileNames = folders.map((item) => item.Name);
    let result = [];
    if (directories !== fileNames) {
        result.push(fileNames.filter((folder) => !directories.includes(folder)));
        result.push(directories.filter((folder) => !fileNames.includes(folder)));
    }

    let promises = [];
    for (let folder of folders) {
        promises.push(checkFiles(folder));
    }

    Promise.all(promises).then((values) => {
        result.push(values.filter((item) => !!item));
        res.status(200).send(result);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error)
    });
}

/**
 * Checks whether the local data and remote data are equal
 * @param folder given folder to check
 * @return {Promise<function>} promise whether the local and remote data strings are equal
 */
function checkFiles(folder) {
    return new Promise((resolve, reject) => {
        fs.readFile(config.exportPath + folder.Name + '/data.json.js', (err, data) => {
            axios.get(config.getIPFSFile, {
                params: {
                    hash: folder.Hash,
                    path: 'data.json.js'
                }
            })
                .then((result) => {
                    (!!result && !!data && result.data !== data.toString()) ? resolve(folder) : resolve();
                })
                .catch((error) => {
                    reject(error);
                });
        });
    });
}

function getFilesRecursively(prefix, path, result) {
    result = result || [];
    const prefixPath = prefix + path;

    // Does not exist
    if (!fs.existsSync(prefixPath))
        return result;

    if (fs.statSync(prefixPath).isDirectory()) {
        const pathFiles = fs.readdirSync(prefixPath);

        // Directory is empty
        if (pathFiles.length === 0) {
            result.push({
                'Name': path,
                'Type': 1
            })
        } else {
            pathFiles.map((name) => {
                getFilesRecursively(prefix, path + '/' + name, result)
            });
        }
    }
    else {
        result.push({
            'Name': path,
            'Type': 2
        });
    }

    return result;
}

function pushLocalFolderRecursively(syncInfo, files, res) {
    if (files.length === 0) {
        res.sendStatus(200);
        return;
    }

    const file = files.pop(),
        content = fs.readFile(config.exportPath + file, (err, data) => {
            if (err) {
                console.log(err);
                res.status(500).send(err);
                return;
            }

            axios.post(config.createIPFS, {
                hash: syncInfo.hash,
                path: syncInfo.path + file.Name,
                content: content
            }).then((result) => {
                // set new hash
                // syncInfo.hash = result.data.hash;

                pushLocalFolderRecursively(syncInfo, files, res);
            }).catch((error) => {
                res.status(500).send(error);
            });
        });
}

export function pushLocalFolder(syncInfo, name, res) {
    const files = getFilesRecursively(config.exportPath, name);

    pushLocalFolderRecursively(syncInfo, files, res);
}

export function pushFiles(path, result, res) {

}

