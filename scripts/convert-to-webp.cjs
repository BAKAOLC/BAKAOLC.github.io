const fs = require('fs').promises;
const os = require('os');
const path = require('path');
const readline = require('readline');

const sharp = require('sharp');

// 配置
const CONFIG = {
  // 输入目录（包含原始图像）
  inputDir: path.resolve(__dirname, '../public/assets'),
  // 支持的图像格式
  supportedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  // WebP 质量（最高质量）
  webpQuality: 100,
  // 跳过 thumbnails 目录
  skipDirs: ['thumbnails'],
};

/**
 * 创建 readline 接口用于用户输入
 * @returns {readline.Interface}
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * 询问用户确认
 * @param {string} question - 问题
 * @returns {Promise<boolean>} 用户确认结果
 */
function askConfirmation(question) {
  return new Promise((resolve) => {
    const rl = createReadlineInterface();
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      // 只有明确输入 y 或 yes 才确认，空输入或其他输入都视为取消（默认 No）
      resolve(normalized === 'y' || normalized === 'yes');
    });
  });
}

/**
 * 检查文件的实际格式是否为 WebP
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} 是否为 WebP 格式
 */
async function isWebPFormat(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return metadata.format === 'webp';
  } catch {
    return false;
  }
}

/**
 * 检查图像是否为动画（多帧）
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} 是否为动画
 */
async function isAnimatedImage(filePath) {
  try {
    // 使用 animated: true 选项读取元数据，这样可以正确检测动画图像
    const metadata = await sharp(filePath, { animated: true }).metadata();
    // pages 属性表示帧数，如果大于 1 则为动画
    return metadata.pages > 1;
  } catch {
    // 如果读取失败，尝试不使用 animated 选项
    try {
      const metadata = await sharp(filePath).metadata();
      // 检查 pages 属性
      return metadata.pages > 1;
    } catch {
      // 如果仍然失败，返回 false（让转换过程处理错误）
      return false;
    }
  }
}

/**
 * 递归获取目录中的所有图像文件
 * @param {string} dir - 目录路径
 * @param {string[]} files - 文件列表
 * @returns {Promise<string[]>} 图像文件路径数组
 */
async function getImageFiles(dir, files = []) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // 跳过指定目录
        if (CONFIG.skipDirs.includes(entry.name)) continue;
        await getImageFiles(fullPath, files);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (CONFIG.supportedFormats.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.warn(`扫描目录失败 ${dir}:`, error.message);
  }

  return files;
}

/**
 * 检查文件是否可访问（未被锁定）
 * @param {string} filePath - 文件路径
 * @returns {Promise<boolean>} 文件是否可访问
 */
async function isFileAccessible(filePath) {
  try {
    // 尝试以读写模式打开文件，如果文件被锁定会失败
    const handle = await fs.open(filePath, 'r+');
    await handle.close();
    return true;
  } catch {
    return false;
  }
}

/**
 * 等待文件可访问
 * @param {string} filePath - 文件路径
 * @param {number} maxWaitTime - 最大等待时间（毫秒）
 * @param {number} checkInterval - 检查间隔（毫秒）
 * @returns {Promise<boolean>} 文件是否最终可访问
 */
async function waitForFileAccessible(filePath, maxWaitTime = 5000, checkInterval = 200) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitTime) {
    if (await isFileAccessible(filePath)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  return false;
}

/**
 * 安全地替换文件
 * @param {string} targetPath - 目标文件路径
 * @param {string} sourcePath - 源文件路径（临时文件）
 * @returns {Promise<{success: boolean, error?: string}>} 替换结果
 */
async function safeReplaceFile(targetPath, sourcePath) {
  try {
    // 检查目标文件是否存在
    let targetExists = false;
    try {
      await fs.access(targetPath);
      targetExists = true;
    } catch {
      // 目标文件不存在，可以直接 rename
      targetExists = false;
    }

    if (targetExists) {
      // 目标文件存在，需要先删除
      // 首先检查文件是否可访问
      if (!(await isFileAccessible(targetPath))) {
        // 如果文件被锁定，等待一段时间
        const accessible = await waitForFileAccessible(targetPath, 5000, 200);
        if (!accessible) {
          return { success: false, error: '文件被占用，无法访问' };
        }
      }

      // 尝试删除目标文件
      try {
        await fs.unlink(targetPath);
      } catch (unlinkError) {
        // 如果删除失败，可能是文件被占用
        if (unlinkError.code === 'EBUSY' || unlinkError.code === 'EACCES') {
          // 等待后重试
          const accessible = await waitForFileAccessible(targetPath, 3000, 200);
          if (!accessible) {
            return { success: false, error: `文件被占用，无法删除: ${unlinkError.message}` };
          }
          // 再次尝试删除
          try {
            await fs.unlink(targetPath);
          } catch (retryError) {
            if (retryError.code === 'EBUSY' || retryError.code === 'EACCES') {
              return { success: false, error: `文件被占用，重试后仍无法删除: ${retryError.message}` };
            }
            throw retryError;
          }
        } else {
          throw unlinkError;
        }
      }
    }

    // 删除成功后（或目标不存在），使用 rename 进行原子替换
    await fs.rename(sourcePath, targetPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * 将图像转换为 WebP 格式（直接覆盖原文件）
 * @param {string} filePath - 文件路径
 * @returns {Promise<{success?: boolean, skipped?: boolean, animated?: boolean, error?: string, retry?: boolean}>} 处理结果
 */
async function convertToWebp(filePath) {
  let tempPath = null;
  try {
    // 检查文件是否已经是 WebP 格式
    const isWebP = await isWebPFormat(filePath);
    if (isWebP) {
      return { skipped: true };
    }

    // 检查是否为动画图像
    const isAnimated = await isAnimatedImage(filePath);

    // 使用系统临时目录创建临时文件，避免文件系统锁定问题
    const tempDir = os.tmpdir();
    const fileName = path.basename(filePath);
    const tempFileName = `webp-convert-${Date.now()}-${Math.random().toString(36).substring(7)}-${fileName}`;
    tempPath = path.join(tempDir, tempFileName);

    // 读取原图像并转换为 WebP
    // 如果是动画图像，启用动画支持
    const sharpInstance = sharp(filePath, isAnimated ? { animated: true } : {});

    // 转换为 WebP 格式
    await sharpInstance
      .webp({
        quality: CONFIG.webpQuality,
        // 如果是动画，启用动画支持
        ...(isAnimated ? { animated: true } : {}),
      })
      .toFile(tempPath);

    // 验证临时文件是否成功创建
    try {
      await fs.access(tempPath);
    } catch {
      return { success: false, error: '临时文件创建失败' };
    }

    // 安全地替换原文件
    const replaceResult = await safeReplaceFile(filePath, tempPath);
    if (!replaceResult.success) {
      // 如果替换失败，标记为需要重试
      return { success: false, error: replaceResult.error, retry: true };
    }

    return { success: true, animated: isAnimated };
  } catch (error) {
    // 如果转换失败，尝试删除临时文件
    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch {
        // 忽略删除临时文件的错误
      }
    }
    return { success: false, animated: false, error: error.message };
  }
}

/**
 * 主函数
 * @returns {Promise<void>}
 */
async function main() {
  console.log('⚠️  警告：此脚本将直接修改原图文件！');
  console.log('⚠️  所有图像将被转换为 WebP 格式（最高质量）');
  console.log('⚠️  文件名将保持不变，但文件内容将被替换');
  console.log('⚠️  动画图像将保持为动画格式');
  console.log('⚠️  已经是 WebP 格式的文件将被跳过');
  console.log('');
  console.log('输入目录:', CONFIG.inputDir);
  console.log('');

  // 检查输入目录是否存在
  try {
    await fs.access(CONFIG.inputDir);
    console.log('✅ 输入目录存在');
  } catch {
    console.error('❌ 输入目录不存在:', CONFIG.inputDir);
    return;
  }

  // 检查 sharp 是否可用
  const sharpVersion = sharp.versions;
  console.log(`使用 Sharp ${sharpVersion.sharp} (libvips ${sharpVersion.vips})`);
  console.log('');

  // 获取所有图像文件
  console.log('正在扫描图像文件...');
  const imageFiles = await getImageFiles(CONFIG.inputDir);
  console.log(`找到 ${imageFiles.length} 个图像文件`);
  console.log('');

  if (imageFiles.length === 0) {
    console.log('没有找到图像文件');
    console.log('支持的格式:', CONFIG.supportedFormats.join(', '));
    return;
  }

  // 显示前几个文件作为示例
  console.log('示例文件:');
  imageFiles.slice(0, 5).forEach(file => {
    console.log(' -', path.relative(CONFIG.inputDir, file));
  });
  if (imageFiles.length > 5) {
    console.log(` ... 还有 ${imageFiles.length - 5} 个文件`);
  }
  console.log('');

  // 用户确认
  const confirmed = await askConfirmation(
    `⚠️  确定要继续吗？这将修改 ${imageFiles.length} 个文件！(y/n): `,
  );

  if (!confirmed) {
    console.log('操作已取消');
    return;
  }

  // 开始转换
  console.log('\n开始转换图像...');
  const startTime = Date.now();
  const results = { success: 0, failed: 0, skipped: 0, animated: 0 };
  const retryFiles = []; // 需要重试的文件列表

  for (let i = 0; i < imageFiles.length; i++) {
    const imagePath = imageFiles[i];
    const relativePath = path.relative(CONFIG.inputDir, imagePath);

    process.stdout.write(`[${i + 1}/${imageFiles.length}] 处理: ${relativePath} ... `);

    const result = await convertToWebp(imagePath);

    if (result.skipped) {
      results.skipped++;
      console.log('- (已是 WebP，跳过)');
    } else if (result.success) {
      results.success++;
      if (result.animated) {
        results.animated++;
        console.log('✓ (动画)');
      } else {
        console.log('✓');
      }
    } else {
      if (result.retry) {
        // 文件被占用，稍后重试
        retryFiles.push(imagePath);
        console.log('⚠ (文件被占用，稍后重试)');
      } else {
        results.failed++;
        console.log(`✗ 错误: ${result.error || '未知错误'}`);
      }
    }
  }

  // 如果有需要重试的文件，等待一段时间后重试
  if (retryFiles.length > 0) {
    console.log(`\n检测到 ${retryFiles.length} 个文件被占用，等待 2 秒后重试...`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    for (let i = 0; i < retryFiles.length; i++) {
      const imagePath = retryFiles[i];
      const relativePath = path.relative(CONFIG.inputDir, imagePath);

      process.stdout.write(`[重试 ${i + 1}/${retryFiles.length}] 处理: ${relativePath} ... `);

      const result = await convertToWebp(imagePath);

      if (result.success) {
        results.success++;
        if (result.animated) {
          results.animated++;
          console.log('✓ (动画)');
        } else {
          console.log('✓');
        }
      } else {
        results.failed++;
        console.log(`✗ 错误: ${result.error || '未知错误'}`);
      }
    }
  }

  const endTime = Date.now();

  console.log(`\n✅ 转换完成! 耗时: ${((endTime - startTime) / 1000).toFixed(2)} 秒`);
  console.log(`📊 统计: 成功 ${results.success} 个，跳过 ${results.skipped} 个，失败 ${results.failed} 个`);
  console.log(`🎬 动画图像: ${results.animated} 个`);
  if (retryFiles.length > 0) {
    console.log(`⚠️  重试了 ${retryFiles.length} 个被占用的文件`);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main().catch((error) => {
    console.error('转换图像时发生错误:', error);
    process.exit(1);
  });
}

module.exports = { main, CONFIG };
