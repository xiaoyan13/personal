import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// 获取当前目录的路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file1 = path.resolve(__dirname, "./filesInserted/_redirects");
const file2 = path.resolve(
  __dirname,
  "./filesInserted/google51587f4674540695.html"
);
const targetFolder = path.resolve(__dirname, "../docs/.vitepress/dist");

try {
  // 复制文件
  await fs.copyFile(file1, path.resolve(targetFolder, path.basename(file1)));

  await fs.copyFile(file2, path.resolve(targetFolder, path.basename(file2)));
  console.log(`文件已复制到 ${targetFolder}`);
} catch (error) {
  console.error(`发生错误: ${error.message}`);
}
