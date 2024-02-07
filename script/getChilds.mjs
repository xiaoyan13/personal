import fs from 'fs'
import path from 'path';
import { fileURLToPath } from 'url';

// 获取 sidebar 数组。
// sidebar 是一个数组，里面有两种对象：
// md 文件，{ text: string, link: string }
// 另一个能够构建合法路由的目录，用 { text: string, items: [] } 表示；

// 获取当前目录的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, '../docs/笔记/');

// console.log(dir)

// now: 现在构建的目录数组 []
// url：对应的 url 路由
// nowDir：对应的实际本地路径
async function getRes(now, url = '/笔记/', nowDir = dir) {
    const files = await fs.promises.readdir(nowDir);
    let directorys = [];
    for (const file of files) {
        const filePath = path.join(nowDir, file);

        let fileName = path.basename(filePath);
        const isDirectory = fs.lstatSync(filePath).isDirectory();
        // 如果是能够构建路由的目录，则收集到数组中，稍后再 push
        if (isDirectory) {
            if (fileName === 'black-box' || fileName === 'images') continue;
            directorys.push(fileName);
        } else {
            // 如果是文件，则直接 push 
            fileName = fileName.slice(0, fileName.length - 3);
            if (fileName === 'index') continue;
            now.push({
                text: fileName,
                link: url + fileName,
            });
        }
    }

    for (const directoryName of directorys) {
        now.push({
            text: directoryName,
            collapsed: true,
            items: await getRes([], url + directoryName + '/', nowDir + directoryName + '/')
        })
    }
    return now;
}

const res = await getRes([]);
console.log(__dirname)
const target = __dirname + '/test.json';


await fs.promises.writeFile(
    target, JSON.stringify(res, null, 2),
    { flag: 'w', encoding: 'utf-8' }
);
console.log('sideBar 生成完毕')